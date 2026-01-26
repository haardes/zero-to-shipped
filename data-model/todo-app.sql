-- Todo App Data Model for Supabase
-- Generated from ERD diagram

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE list_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE todo_item_status AS ENUM ('pending', 'completed');

-- App User Table
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Todo List Table
CREATE TABLE todo_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Todo Item Table
CREATE TABLE todo_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status todo_item_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_by_user_id UUID NOT NULL REFERENCES app_user(id),
    updated_by_user_id UUID NOT NULL REFERENCES app_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- List Membership Table
CREATE TABLE list_membership (
    list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role list_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (list_id, user_id)
);

-- Invitation Table
CREATE TABLE invitation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by_user_id UUID NOT NULL REFERENCES app_user(id),
    role list_role NOT NULL DEFAULT 'viewer',
    status invitation_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_todo_list_owner ON todo_list(owner_user_id);
CREATE INDEX idx_todo_item_list ON todo_item(list_id);
CREATE INDEX idx_todo_item_status ON todo_item(status);
CREATE INDEX idx_list_membership_user ON list_membership(user_id);
CREATE INDEX idx_invitation_email ON invitation(invited_email);
CREATE INDEX idx_invitation_list ON invitation(list_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_app_user_updated_at BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_list_updated_at BEFORE UPDATE ON todo_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_item_updated_at BEFORE UPDATE ON todo_item
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_user
CREATE POLICY "Users can view their own profile" ON app_user
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON app_user
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for todo_list
CREATE POLICY "Users can view lists they own or are members of" ON todo_list
    FOR SELECT USING (
        owner_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM list_membership WHERE list_id = id AND user_id = auth.uid())
    );

CREATE POLICY "Users can create their own lists" ON todo_list
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners can update their lists" ON todo_list
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can delete their lists" ON todo_list
    FOR DELETE USING (owner_user_id = auth.uid());

-- RLS Policies for todo_item
CREATE POLICY "Users can view items in accessible lists" ON todo_item
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM todo_list tl
            LEFT JOIN list_membership lm ON tl.id = lm.list_id
            WHERE tl.id = list_id AND (tl.owner_user_id = auth.uid() OR lm.user_id = auth.uid())
        )
    );

CREATE POLICY "Users with editor/owner role can create items" ON todo_item
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM todo_list tl
            LEFT JOIN list_membership lm ON tl.id = lm.list_id
            WHERE tl.id = list_id AND (
                tl.owner_user_id = auth.uid() OR
                (lm.user_id = auth.uid() AND lm.role IN ('owner', 'editor'))
            )
        )
    );

CREATE POLICY "Users with editor/owner role can update items" ON todo_item
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM todo_list tl
            LEFT JOIN list_membership lm ON tl.id = lm.list_id
            WHERE tl.id = list_id AND (
                tl.owner_user_id = auth.uid() OR
                (lm.user_id = auth.uid() AND lm.role IN ('owner', 'editor'))
            )
        )
    );

CREATE POLICY "Users with editor/owner role can delete items" ON todo_item
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM todo_list tl
            LEFT JOIN list_membership lm ON tl.id = lm.list_id
            WHERE tl.id = list_id AND (
                tl.owner_user_id = auth.uid() OR
                (lm.user_id = auth.uid() AND lm.role IN ('owner', 'editor'))
            )
        )
    );

-- RLS Policies for list_membership
CREATE POLICY "Users can view memberships for accessible lists" ON list_membership
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM todo_list WHERE id = list_id AND owner_user_id = auth.uid())
    );

CREATE POLICY "List owners can manage memberships" ON list_membership
    FOR ALL USING (
        EXISTS (SELECT 1 FROM todo_list WHERE id = list_id AND owner_user_id = auth.uid())
    );

-- RLS Policies for invitation
CREATE POLICY "Users can view invitations sent to them" ON invitation
    FOR SELECT USING (
        invited_email = (SELECT email FROM app_user WHERE id = auth.uid()) OR
        invited_by_user_id = auth.uid()
    );

CREATE POLICY "List owners can create invitations" ON invitation
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM todo_list WHERE id = list_id AND owner_user_id = auth.uid())
    );

CREATE POLICY "Invited users can update invitation status" ON invitation
    FOR UPDATE USING (
        invited_email = (SELECT email FROM app_user WHERE id = auth.uid())
    );
