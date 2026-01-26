// User type now comes from Supabase auth.users
// Access via supabase.auth.getUser()
export interface User {
  id: string
  email: string
  createdAt: string
}
