# Supabase Migrations

This directory contains database migrations for the Todo Tracking Application.

## Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

## Local Development

### Initialize Supabase locally

```bash
supabase init
```

### Start local Supabase instance

```bash
supabase start
```

This will start:
- PostgreSQL database on port 54322
- API server on port 54321
- Studio UI on port 54323

### Apply migrations locally

```bash
supabase db reset
```

## Production Deployment

### Link to your Supabase project

```bash
supabase link --project-ref your-project-ref
```

### Push migrations to production

```bash
supabase db push
```

### Generate TypeScript types

After applying migrations, regenerate types:

```bash
supabase gen types typescript --local > ../web/types/database.ts
```

## Migration Files

- `20260126000000_initial_schema.sql` - Initial database schema with:
  - Custom ENUM types (list_role, invitation_status, todo_item_status)
  - Core tables (app_user, todo_list, todo_item, list_membership, invitation)
  - Indexes for performance optimization
  - Triggers for automatic timestamp updates
  - Row Level Security (RLS) policies for data access control

## Database Schema

### Tables

1. **app_user** - User accounts
2. **todo_list** - Todo lists owned by users
3. **todo_item** - Individual todo items within lists
4. **list_membership** - User access to shared lists
5. **invitation** - Pending/processed invitations to share lists

### Key Features

- UUID primary keys with `gen_random_uuid()`
- Automatic timestamp management (created_at, updated_at)
- Cascading deletes for referential integrity
- Row Level Security for multi-tenant data isolation
- Automatic owner membership creation on list creation
- Automatic completed_at timestamp when items are marked complete

## Useful Commands

```bash
# Check migration status
supabase migration list

# Create a new migration
supabase migration new migration_name

# Reset database (drops and recreates)
supabase db reset

# View database diff
supabase db diff

# Generate migration from schema changes
supabase db diff --schema public -f migration_name
```
