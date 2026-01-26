# Migrating to Remote Backend

This guide explains how to migrate from local state to Azure Storage remote backend for team collaboration and CI/CD pipelines.

## Why Use Remote Backend?

**Local State Limitations:**
- State files stored on individual machines
- No state locking (risk of concurrent modifications)
- Difficult to share state across team members
- CI/CD pipelines lose state between runs
- Manual backup required

**Remote Backend Benefits:**
- Centralized state storage
- State locking prevents concurrent modifications
- Team collaboration enabled
- CI/CD pipelines can access persistent state
- Automatic backup and versioning

## Prerequisites

- Azure CLI installed and logged in
- Existing Terraform configuration with local state
- Appropriate Azure permissions

## Step 1: Create Azure Storage Backend

### 1.1 Run Setup Script

```bash
cd terraform

# Create setup script
cat > scripts/setup-remote-backend.sh <<'EOF'
#!/bin/bash
set -e

RESOURCE_GROUP_NAME="terraform-state-rg"
STORAGE_ACCOUNT_NAME="tfstate$(openssl rand -hex 4)"
CONTAINER_NAME="tfstate"
LOCATION="eastus"

echo "Creating resource group..."
az group create \
    --name $RESOURCE_GROUP_NAME \
    --location $LOCATION

echo "Creating storage account..."
az storage account create \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku Standard_LRS \
    --encryption-services blob \
    --https-only true \
    --min-tls-version TLS1_2

echo "Creating blob container..."
az storage container create \
    --name $CONTAINER_NAME \
    --account-name $STORAGE_ACCOUNT_NAME

echo "Backend setup complete!"
echo "Storage Account: $STORAGE_ACCOUNT_NAME"
echo ""
echo "Add this to your main.tf backend block:"
echo "  resource_group_name  = \"$RESOURCE_GROUP_NAME\""
echo "  storage_account_name = \"$STORAGE_ACCOUNT_NAME\""
echo "  container_name       = \"$CONTAINER_NAME\""
echo "  key                  = \"todoapp.terraform.tfstate\""
EOF

chmod +x scripts/setup-remote-backend.sh
./scripts/setup-remote-backend.sh
```

### 1.2 Note the Output

Save the storage account name and other details from the output.

## Step 2: Update Terraform Configuration

### 2.1 Modify main.tf

Update the backend configuration in `terraform/main.tf`:

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstateXXXXXXXX"  # Replace with your storage account
    container_name       = "tfstate"
    key                  = "todoapp.terraform.tfstate"
  }
}
```

Or use a backend configuration file:

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {}
}
```

### 2.2 Create Backend Config File

Create `terraform/backend.hcl`:

```hcl
resource_group_name  = "terraform-state-rg"
storage_account_name = "tfstateXXXXXXXX"  # Replace with your storage account
container_name       = "tfstate"
key                  = "todoapp.terraform.tfstate"
```

Add to `.gitignore`:
```
backend.hcl
```

## Step 3: Migrate State

### 3.1 Backup Current State

```bash
# Backup local state files
cp terraform.tfstate terraform.tfstate.backup-$(date +%Y%m%d)

# Backup workspace states
cp -r terraform.tfstate.d terraform.tfstate.d.backup-$(date +%Y%m%d)
```

### 3.2 Migrate to Remote Backend

```bash
# Initialize with new backend and migrate state
terraform init -backend-config="backend.hcl" -migrate-state

# Terraform will prompt: "Do you want to copy existing state to the new backend?"
# Answer: yes
```

### 3.3 Verify Migration

```bash
# Check that state is now remote
terraform state list

# Verify in Azure
az storage blob list \
  --account-name tfstateXXXXXXXX \
  --container-name tfstate \
  --output table
```

## Step 4: Update Scripts

### 4.1 Update deploy.sh

Modify `terraform/scripts/deploy.sh`:

```bash
# Initialize Terraform with remote backend
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init -backend-config="backend.hcl"
```

### 4.2 Update quick-deploy.sh

Add backend check to `terraform/scripts/quick-deploy.sh`:

```bash
# Check if backend exists
if [ ! -f "backend.hcl" ]; then
    echo ""
    echo -e "${YELLOW}Backend not configured. Setting up...${NC}"
    ./scripts/setup-remote-backend.sh
    echo "Please create backend.hcl with the storage account details"
    exit 0
fi
```

## Step 5: Update CI/CD Pipeline

### 5.1 Add GitHub Secrets

Add these secrets to your GitHub repository:

- `TF_STATE_RESOURCE_GROUP`: terraform-state-rg
- `TF_STATE_STORAGE_ACCOUNT`: Your storage account name
- `TF_STATE_CONTAINER`: tfstate

### 5.2 Update GitHub Actions Workflow

Modify `.github/workflows/azure-deploy.yml`:

```yaml
- name: Terraform Init
  run: |
    cat > backend.hcl <<EOF
    resource_group_name  = "${{ secrets.TF_STATE_RESOURCE_GROUP }}"
    storage_account_name = "${{ secrets.TF_STATE_STORAGE_ACCOUNT }}"
    container_name       = "${{ secrets.TF_STATE_CONTAINER }}"
    key                  = "todoapp.terraform.tfstate"
    EOF
    terraform init -backend-config="backend.hcl"
```

## Step 6: Team Setup

### 6.1 Share Backend Configuration

Share the `backend.hcl` file securely with team members (via password manager, not Git).

### 6.2 Team Member Setup

Team members should:

```bash
# Clone repository
git clone <repository-url>
cd <repository>/terraform

# Create backend.hcl with shared configuration
cat > backend.hcl <<EOF
resource_group_name  = "terraform-state-rg"
storage_account_name = "tfstateXXXXXXXX"
container_name       = "tfstate"
key                  = "todoapp.terraform.tfstate"
EOF

# Initialize
terraform init -backend-config="backend.hcl"

# Select workspace
terraform workspace select dev
```

## State Locking

Azure Storage backend automatically provides state locking using blob leases.

### Check Lock Status

```bash
# If state is locked, you'll see an error with lock info
terraform plan

# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

## Workspace Management

With remote backend, workspaces are stored in separate blobs:

```bash
# List workspaces
terraform workspace list

# Create new workspace
terraform workspace new staging

# Switch workspace
terraform workspace select production
```

Each workspace creates a separate state file:
- Default: `todoapp.terraform.tfstate`
- Dev: `env:dev/todoapp.terraform.tfstate`
- Production: `env:production/todoapp.terraform.tfstate`

## Backup and Recovery

### Enable Soft Delete

```bash
az storage account blob-service-properties update \
  --account-name tfstateXXXXXXXX \
  --enable-delete-retention true \
  --delete-retention-days 30
```

### Enable Versioning

```bash
az storage account blob-service-properties update \
  --account-name tfstateXXXXXXXX \
  --enable-versioning true
```

### Restore from Backup

```bash
# List blob versions
az storage blob list \
  --account-name tfstateXXXXXXXX \
  --container-name tfstate \
  --include v \
  --output table

# Download specific version
az storage blob download \
  --account-name tfstateXXXXXXXX \
  --container-name tfstate \
  --name todoapp.terraform.tfstate \
  --version-id <VERSION_ID> \
  --file terraform.tfstate.backup
```

## Cleanup Local State

After successful migration and verification:

```bash
# Remove local state files
rm -f terraform.tfstate terraform.tfstate.backup
rm -rf terraform.tfstate.d/

# Keep .terraform directory (contains provider plugins)
```

## Troubleshooting

### Migration Failed

```bash
# Reset to local backend
rm -rf .terraform
git checkout main.tf

# Restore from backup
cp terraform.tfstate.backup-YYYYMMDD terraform.tfstate

# Try migration again
```

### State Lock Timeout

```bash
# Check lock info
terraform force-unlock -help

# Force unlock (only if you're sure no other process is running)
terraform force-unlock <LOCK_ID>
```

### Access Denied

```bash
# Verify Azure login
az account show

# Check storage account permissions
az role assignment list \
  --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/terraform-state-rg/providers/Microsoft.Storage/storageAccounts/tfstateXXXXXXXX
```

## Best Practices

1. **Enable versioning** on the storage account
2. **Enable soft delete** for recovery
3. **Use separate storage accounts** for different environments
4. **Restrict access** using Azure RBAC
5. **Enable encryption** at rest (enabled by default)
6. **Monitor access** using Azure Monitor
7. **Regular backups** of state files
8. **Document backend configuration** for team members

## Cost Considerations

Azure Storage backend costs:
- Storage: ~$0.02/GB/month (LRS)
- Transactions: Minimal (state operations are infrequent)
- Estimated: <$1/month for typical usage

## Reverting to Local Backend

If needed, you can revert to local backend:

```bash
# Update main.tf to remove backend block
# Then run:
terraform init -migrate-state

# Answer "yes" to copy state back to local
```

## Support

For issues with remote backend:
- [Terraform Azure Backend Documentation](https://www.terraform.io/docs/language/settings/backends/azurerm.html)
- [Azure Storage Documentation](https://docs.microsoft.com/azure/storage/)
