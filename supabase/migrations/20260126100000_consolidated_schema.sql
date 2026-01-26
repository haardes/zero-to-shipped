-- Consolidated Schema Migration for Todo Tracking Application
-- Created: 2026-01-26
-- This migration consolidates all schema changes and RLS policies
-- Uses Supabase auth.users for authentication

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom ENUM types
CREATE TYPE list_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE todo_item_status AS ENUM ('pending', 'completed');

-- ============================================
-- TABLES
-- ============================================

-- Create todo_list table
CREATE TABLE todo_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create todo_item table
CREATE TABLE todo_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
  status todo_item_status NOT NULL DEFAULT 'pending',
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create list_membership table
CREATE TABLE list_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role list_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- Create invitation table
CREATE TABLE invitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role list_role NOT NULL CHECK (role IN ('editor', 'viewer')),
  status invitation_status NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, invited_email)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_todo_list_owner ON todo_list(owner_user_id);
CREATE INDEX idx_todo_item_list ON todo_item(list_id);
CREATE INDEX idx_todo_item_status ON todo_item(status);
CREATE INDEX idx_list_membership_user ON list_membership(user_id);
CREATE INDEX idx_list_membership_list ON list_membership(list_id);
CREATE INDEX idx_invitation_email ON invitation(invited_email);
CREATE INDEX idx_invitation_status ON invitation(status);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_todo_list_updated_at
  BEFORE UPDATE ON todo_list
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_item_updated_at
  BEFORE UPDATE ON todo_item
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create list_membership for list owner
CREATE OR REPLACE FUNCTION create_owner_membership()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO list_membership (list_id, user_id, role)
  VALUES (NEW.id, NEW.owner_user_id, 'owner');
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for automatic owner membership
CREATE TRIGGER create_owner_membership_trigger
  AFTER INSERT ON todo_list
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_membership();

-- Function to set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status = 'pending' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger for completed_at
CREATE TRIGGER set_completed_at_trigger
  BEFORE UPDATE ON todo_item
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();

-- ============================================
-- SECURITY DEFINER FUNCTIONS (to avoid RLS recursion)
-- ============================================

-- Function to check if user has access to a list
CREATE OR REPLACE FUNCTION user_has_list_access(list_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM list_membership 
    WHERE list_id = list_uuid 
    AND user_id = user_uuid
  );
END;
$;

-- Function to check if user is list owner
CREATE OR REPLACE FUNCTION user_is_list_owner(list_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM todo_list 
    WHERE id = list_uuid 
    AND owner_user_id = user_uuid
  );
END;
$;

-- Function to get user's role in a list
CREATE OR REPLACE FUNCTION user_list_role(list_uuid UUID, user_uuid UUID)
RETURNS list_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  user_role list_role;
BEGIN
  SELECT role INTO user_role
  FROM list_membership 
  WHERE list_id = list_uuid 
  AND user_id = user_uuid;
  
  RETURN user_role;
END;
$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE todo_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON auth.users TO authenticated;

-- ============================================
-- list_membership POLICIES (base table, no dependencies)
-- ============================================

CREATE POLICY "membership_select_own"
  ON list_membership FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "membership_select_as_owner"
  ON list_membership FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todo_list 
      WHERE id = list_membership.list_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "membership_insert"
  ON list_membership FOR INSERT
  WITH CHECK (
    -- Allow if user is owner of the list
    EXISTS (
      SELECT 1 FROM todo_list 
      WHERE id = list_membership.list_id 
      AND owner_user_id = auth.uid()
    )
    OR
    -- Allow if this is the user's own membership (for trigger)
    user_id = auth.uid()
  );

CREATE POLICY "membership_update"
  ON list_membership FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM todo_list 
      WHERE id = list_membership.list_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "membership_delete"
  ON list_membership FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM todo_list 
      WHERE id = list_membership.list_id 
      AND owner_user_id = auth.uid()
    )
  );

-- ============================================
-- todo_list POLICIES
-- ============================================

CREATE POLICY "list_insert"
  ON todo_list FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "list_select_owner"
  ON todo_list FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY "list_select_member"
  ON todo_list FOR SELECT
  USING (user_has_list_access(id, auth.uid()));

CREATE POLICY "list_update"
  ON todo_list FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "list_delete"
  ON todo_list FOR DELETE
  USING (owner_user_id = auth.uid());

-- ============================================
-- todo_item POLICIES
-- ============================================

CREATE POLICY "item_select"
  ON todo_item FOR SELECT
  USING (user_has_list_access(list_id, auth.uid()));

CREATE POLICY "item_insert"
  ON todo_item FOR INSERT
  WITH CHECK (
    user_list_role(list_id, auth.uid()) IN ('owner', 'editor')
  );

CREATE POLICY "item_update"
  ON todo_item FOR UPDATE
  USING (
    user_list_role(list_id, auth.uid()) IN ('owner', 'editor')
  )
  WITH CHECK (
    user_list_role(list_id, auth.uid()) IN ('owner', 'editor')
  );

CREATE POLICY "item_delete"
  ON todo_item FOR DELETE
  USING (
    user_list_role(list_id, auth.uid()) IN ('owner', 'editor')
  );

-- ============================================
-- invitation POLICIES
-- ============================================

CREATE POLICY "invitation_select_invited"
  ON invitation FOR SELECT
  USING (
    invited_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "invitation_select_owner"
  ON invitation FOR SELECT
  USING (
    user_is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "invitation_insert"
  ON invitation FOR INSERT
  WITH CHECK (
    user_is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "invitation_update"
  ON invitation FOR UPDATE
  USING (
    invited_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    invited_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "invitation_delete"
  ON invitation FOR DELETE
  USING (
    user_is_list_owner(list_id, auth.uid())
  );
