-- Todo App Data Model for Supabase
-- Generated from ERD diagram

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums
CREATE TYPE todo_item_status AS ENUM ('pending', 'completed', 'archived');
CREATE TYPE list_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- App User table
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Todo List table
CREATE TABLE todo_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Todo Item table
CREATE TABLE todo_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- List Membership table (many-to-many between users and lists)
CREATE TABLE list_membership (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
    role list_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, list_id)
);

-- Invitation table
CREATE TABLE invitation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by_user_id UUID NOT NULL REFERENCES app_user(id),
    role list_role NOT NULL DEFAULT 'viewer',
    token TEXT NOT NULL UNIQUE,
    status invitation_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- Indexes for better performance
CREATE INDEX idx_todo_list_owner ON todo_list(owner_user_id);
CREATE INDEX idx_todo_item_list ON todo_item(list_id);
CREATE INDEX idx_todo_item_status ON todo_item(status);
CREATE INDEX idx_list_membership_user ON list_membership(user_id);
CREATE INDEX idx_list_membership_list ON list_membership(list_id);
CREATE INDEX idx_invitation_email ON invitation(invited_email);
CREATE INDEX idx_invitation_token ON invitation(token);
CREATE INDEX idx_invitation_status ON invitation(status);

-- Triggers to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_user_updated_at BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_list_updated_at BEFORE UPDATE ON todo_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_item_updated_at BEFORE UPDATE ON todo_item
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies for Supabase
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- App User policies
CREATE POLICY "Users can view their own profile" ON app_user
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON app_user
    FOR UPDATE USING (auth.uid() = id);

-- Todo List policies
CREATE POLICY "Users can view lists they own or are members of" ON todo_list
    FOR SELECT USING (
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM list_membership 
            WHERE list_id = todo_list.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own lists" ON todo_list
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "List owners can update their lists" ON todo_list
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "List owners can delete their lists" ON todo_list
    FOR DELETE USING (owner_user_id = auth.uid());

-- Todo Item policies
CREATE POLICY "Users can view items in lists they have access to" ON todo_item
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM todo_list tl
            LEFT JOIN list_membership lm ON tl.id = lm.list_id
            WHERE tl.id = todo_item.list_id AND (
                tl.owner_user_id = auth.uid() OR
                lm.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create items in lists they have editor+ access to" ON todo_item
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

CREATE POLICY "Users can update items in lists they have editor+ access to" ON todo_item
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

CREATE POLICY "Users can delete items in lists they have editor+ access to" ON todo_item
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

-- List Membership policies
CREATE POLICY "Users can view memberships for lists they have access to" ON list_membership
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM todo_list tl
            WHERE tl.id = list_id AND tl.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "List owners can manage memberships" ON list_membership
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM todo_list tl
            WHERE tl.id = list_id AND tl.owner_user_id = auth.uid()
        )
    );

-- Invitation policies
CREATE POLICY "Users can view invitations sent to their email" ON invitation
    FOR SELECT USING (
        invited_email = auth.email() OR
        invited_by_user_id = auth.uid()
    );

CREATE POLICY "List owners can create invitations" ON invitation
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM todo_list tl
            WHERE tl.id = list_id AND tl.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Invited users can update invitation status" ON invitation
    FOR UPDATE USING (invited_email = auth.email());