-- Todo Application Database Schema for Supabase
-- Generated from ERD diagram

-- Create custom types
CREATE TYPE list_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE todo_item_status AS ENUM ('open', 'completed');

-- ============================================
-- Table: app_user
-- ============================================
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: todo_list
-- ============================================
CREATE TABLE todo_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: todo_item
-- ============================================
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

-- ============================================
-- Table: list_membership
-- ============================================
CREATE TABLE list_membership (
    list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role list_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (list_id, user_id)
);

-- ============================================
-- Table: invitation
-- ============================================
CREATE TABLE invitation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES todo_list(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by_user_id UUID NOT NULL REFERENCES app_user(id),
    role list_role NOT NULL,
    status invitation_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_todo_list_owner ON todo_list(owner_user_id);
CREATE INDEX idx_todo_item_list ON todo_item(list_id);
CREATE INDEX idx_todo_item_status ON todo_item(status);
CREATE INDEX idx_list_membership_user ON list_membership(user_id);
CREATE INDEX idx_invitation_email ON invitation(invited_email);
CREATE INDEX idx_invitation_status ON invitation(status);

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_user_updated_at
    BEFORE UPDATE ON app_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_list_updated_at
    BEFORE UPDATE ON todo_list
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_item_updated_at
    BEFORE UPDATE ON todo_item
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation ENABLE ROW LEVEL SECURITY;

-- app_user policies
CREATE POLICY "Users can view their own profile"
    ON app_user FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON app_user FOR UPDATE
    USING (auth.uid() = id);

-- todo_list policies
CREATE POLICY "Users can view lists they own or are members of"
    ON todo_list FOR SELECT
    USING (
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM list_membership
            WHERE list_membership.list_id = todo_list.id
            AND list_membership.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own lists"
    ON todo_list FOR INSERT
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update lists they own or are editors of"
    ON todo_list FOR UPDATE
    USING (
        owner_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM list_membership
            WHERE list_membership.list_id = todo_list.id
            AND list_membership.user_id = auth.uid()
            AND list_membership.role = 'editor'
        )
    );

CREATE POLICY "Only owners can delete lists"
    ON todo_list FOR DELETE
    USING (owner_user_id = auth.uid());

-- todo_item policies
CREATE POLICY "Users can view items in lists they have access to"
    ON todo_item FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = todo_item.list_id
            AND (
                todo_list.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM list_membership
                    WHERE list_membership.list_id = todo_list.id
                    AND list_membership.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create items in lists they have access to"
    ON todo_item FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = todo_item.list_id
            AND (
                todo_list.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM list_membership
                    WHERE list_membership.list_id = todo_list.id
                    AND list_membership.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update items in lists they have access to"
    ON todo_item FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = todo_item.list_id
            AND (
                todo_list.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM list_membership
                    WHERE list_membership.list_id = todo_list.id
                    AND list_membership.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete items in lists they have access to"
    ON todo_item FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = todo_item.list_id
            AND (
                todo_list.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM list_membership
                    WHERE list_membership.list_id = todo_list.id
                    AND list_membership.user_id = auth.uid()
                )
            )
        )
    );

-- list_membership policies
CREATE POLICY "Users can view memberships for lists they have access to"
    ON list_membership FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = list_membership.list_id
            AND todo_list.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Only list owners can manage memberships"
    ON list_membership FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = list_membership.list_id
            AND todo_list.owner_user_id = auth.uid()
        )
    );

-- invitation policies
CREATE POLICY "Users can view invitations sent to them or by them"
    ON invitation FOR SELECT
    USING (
        invited_email = (SELECT email FROM app_user WHERE id = auth.uid()) OR
        invited_by_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = invitation.list_id
            AND todo_list.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "List owners can create invitations"
    ON invitation FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM todo_list
            WHERE todo_list.id = invitation.list_id
            AND todo_list.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "Invited users can update their invitation status"
    ON invitation FOR UPDATE
    USING (
        invited_email = (SELECT email FROM app_user WHERE id = auth.uid())
    );

-- ============================================
-- Helper Functions
-- ============================================

-- Function to automatically create list membership when a list is created
CREATE OR REPLACE FUNCTION create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO list_membership (list_id, user_id, role)
    VALUES (NEW.id, NEW.owner_user_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_owner_membership_trigger
    AFTER INSERT ON todo_list
    FOR EACH ROW
    EXECUTE FUNCTION create_owner_membership();

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
    inv_record RECORD;
BEGIN
    SELECT * INTO inv_record
    FROM invitation
    WHERE id = invitation_id
    AND invited_email = (SELECT email FROM app_user WHERE id = auth.uid())
    AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found or already processed';
    END IF;

    -- Create membership
    INSERT INTO list_membership (list_id, user_id, role)
    VALUES (inv_record.list_id, auth.uid(), inv_record.role)
    ON CONFLICT (list_id, user_id) DO NOTHING;

    -- Update invitation status
    UPDATE invitation
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
