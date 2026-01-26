export type Database = {
  public: {
    Tables: {
      app_user: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      todo_list: {
        Row: {
          id: string
          title: string
          description: string | null
          owner_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          owner_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          owner_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      todo_item: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          status: 'pending' | 'completed'
          created_by_user_id: string
          updated_by_user_id: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'completed'
          created_by_user_id: string
          updated_by_user_id: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'completed'
          created_by_user_id?: string
          updated_by_user_id?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      list_membership: {
        Row: {
          id: string
          list_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
      }
      invitation: {
        Row: {
          id: string
          list_id: string
          invited_email: string
          invited_by_user_id: string
          role: 'editor' | 'viewer'
          status: 'pending' | 'accepted' | 'declined'
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          invited_email: string
          invited_by_user_id: string
          role: 'editor' | 'viewer'
          status?: 'pending' | 'accepted' | 'declined'
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          invited_email?: string
          invited_by_user_id?: string
          role?: 'editor' | 'viewer'
          status?: 'pending' | 'accepted' | 'declined'
          accepted_at?: string | null
          created_at?: string
        }
      }
    }
    Enums: {
      list_role: 'owner' | 'editor' | 'viewer'
      invitation_status: 'pending' | 'accepted' | 'declined'
      todo_item_status: 'pending' | 'completed'
    }
  }
}
