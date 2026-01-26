# Terraform State Management

## Current Configuration: Local State

This Terraform configuration uses **local state** by default. State files are stored in the `terraform/` directory on your local machine.

## Local State Files

### File Locations

- **Default workspace**: `terraform.tfstate`
- **Named workspaces**: `terraform.tfstate.d/<workspace-name>/terraform.tfstate`
- **Backup files**: `terraform.tfstate.backup`

### What's in State Files?

State files contain:
- Resource IDs and metadata
- Resource attributes and outputs
- Sensitive data (connection strings, keys, etc.)
- Dependency information

**⚠️ CRITICAL: Never commit state files to version control!**

## .gitignore Configuration

The following patterns are excluded from Git:

```gitignore
*.tfstate
*.tfstate.*
*.tfstate.backup
*.tfvars.local
*.tfplan
```

## Workspace Management

Workspaces allow multiple environments with separate state:

```bash
# List workspaces
terraform workspace list

# Create workspace
terraform workspace new dev

# Switch workspace
terraform workspace select dev

# Show current workspace
terraform workspace show

# Delete workspace (must be empty)
terraform workspace delete dev
```

### Workspace State Isolation

Each workspace maintains its own state file:

```
terraform/
├── terraform.tfstate.d/
│   ├── dev/
│   │   └── terraform.tfstate
│   ├── staging/
│   │   └── terraform.tfstate
│   └── production/
│       └── terraform.tfstate
```

## Backup Strategy

### Manual Backups

```bash
# Backup current state
cp terraform.tfstate terraform.tfstate.backup-$(date +%Y%m%d-%H%M%S)

# Backup workspace state
cp terraform.tfstate.d/dev/terraform.tfstate \
   terraform.tfstate.d/dev/terraform.tfstate.backup-$(date +%Y%m%d-%H%M%S)
```

### Automated Backup Script

Create `scripts/backup-state.sh`:

```bash
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup all workspace states
if [ -d "terraform.tfstate.d" ]; then
    cp -r terraform.tfstate.d $BACKUP_DIR/
fi

# Backup default state if exists
if [ -f "terraform.tfstate" ]; then
    cp terraform.tfstate $BACKUP_DIR/
fi

echo "State backed up to $BACKUP_DIR"
```

### Backup Schedule

Recommended backup frequency:
- **Before major changes**: Always
- **After successful apply**: Always
- **Daily**: For active development
- **Weekly**: For stable environments

## State Recovery

### Restore from Backup

```bash
# Restore default workspace
cp terraform.tfstate.backup-YYYYMMDD-HHMMSS terraform.tfstate

# Restore named workspace
cp terraform.tfstate.d/dev/terraform.tfstate.backup-YYYYMMDD-HHMMSS \
   terraform.tfstate.d/dev/terraform.tfstate
```

### Verify Restored State

```bash
terraform state list
terraform plan
```

## State Inspection

### List Resources

```bash
terraform state list
```

### Show Resource Details

```bash
terraform state show azurerm_linux_web_app.main
```

### Pull State

```bash
# Output state as JSON
terraform state pull > state.json
```

## State Modification (Advanced)

### Remove Resource from State

```bash
# Remove without destroying actual resource
terraform state rm azurerm_linux_web_app.main
```

### Move Resource

```bash
# Rename resource in state
terraform state mv azurerm_linux_web_app.main azurerm_linux_web_app.app
```

### Import Existing Resource

```bash
# Import existing Azure resource
terraform import azurerm_linux_web_app.main /subscriptions/.../resourceGroups/.../providers/Microsoft.Web/sites/...
```

## Limitations of Local State

### Single User

- State stored on one machine
- No automatic sharing with team
- Manual coordination required

### No State Locking

- Risk of concurrent modifications
- No protection against simultaneous applies
- Manual coordination required

### CI/CD Challenges

- State not persisted between pipeline runs
- Each run starts with empty state
- Infrastructure may be recreated unnecessarily

### No Automatic Backup

- Manual backup process required
- Risk of data loss
- No versioning history

## When to Migrate to Remote Backend

Consider migrating when:

1. **Team Collaboration**: Multiple people managing infrastructure
2. **CI/CD Pipelines**: Automated deployments needed
3. **State Locking**: Prevent concurrent modifications
4. **Backup/Versioning**: Automatic state history
5. **Disaster Recovery**: Centralized, backed-up state

## Migration Path

See `REMOTE_BACKEND_MIGRATION.md` for detailed instructions on migrating to Azure Storage backend.

Quick overview:

1. Create Azure Storage account
2. Update `main.tf` backend configuration
3. Run `terraform init -migrate-state`
4. Verify migration
5. Update team workflows

## Security Best Practices

### Protect State Files

1. **Never commit to Git**: Ensure .gitignore is configured
2. **Encrypt at rest**: Store on encrypted filesystem
3. **Restrict access**: Limit who can access state files
4. **Secure backups**: Encrypt backup storage
5. **Audit access**: Track who accesses state files

### Sensitive Data in State

State files contain sensitive information:
- Resource IDs
- Connection strings
- API keys
- Passwords
- Private keys

**Always treat state files as highly sensitive!**

### Cleaning Sensitive Data

If state file is accidentally exposed:

1. **Rotate all secrets** referenced in state
2. **Recreate resources** with new credentials
3. **Update application** with new secrets
4. **Audit access logs** for unauthorized access

## Troubleshooting

### State File Corrupted

```bash
# Restore from backup
cp terraform.tfstate.backup terraform.tfstate

# Or restore from last known good backup
cp backups/YYYYMMDD/terraform.tfstate .
```

### State Out of Sync

```bash
# Refresh state from actual infrastructure
terraform refresh

# Or force reconciliation
terraform apply -refresh-only
```

### Lost State File

If state is completely lost:

1. **Check backups**: Restore from most recent backup
2. **Import resources**: Manually import each resource
3. **Recreate**: Last resort - destroy and recreate

### Workspace Confusion

```bash
# Check current workspace
terraform workspace show

# List all workspaces
terraform workspace list

# Switch to correct workspace
terraform workspace select dev
```

## Monitoring State Changes

### Track State Size

```bash
# Check state file size
ls -lh terraform.tfstate

# Check workspace state sizes
du -h terraform.tfstate.d/
```

### State Change History

With local state, maintain a change log:

```bash
# After each apply, log changes
echo "$(date): Applied changes - $(terraform output -json | jq -r .app_service_url.value)" >> state-changes.log
```

## Performance Considerations

### Large State Files

If state grows large (>10MB):

- Consider splitting into multiple configurations
- Use `-target` for selective operations
- Migrate to remote backend with better performance

### Slow Operations

```bash
# Skip refresh for faster planning
terraform plan -refresh=false

# Target specific resources
terraform plan -target=azurerm_linux_web_app.main
```

## Summary

**Current Setup:**
- ✅ Simple setup, no external dependencies
- ✅ Works well for single-user scenarios
- ✅ No additional Azure costs
- ⚠️ Manual backup required
- ⚠️ No state locking
- ⚠️ Not suitable for teams or CI/CD

**Next Steps:**
- Use local state for development and testing
- Implement regular backup routine
- Consider remote backend for production
- See `REMOTE_BACKEND_MIGRATION.md` when ready to migrate
