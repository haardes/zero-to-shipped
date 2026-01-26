# Azure Terraform Deployment

This directory contains Terraform configuration to deploy the Next.js web application to Azure App Service.

## Architecture

- **Azure App Service (Linux)**: Hosts the Next.js application with Node.js 20 LTS
- **App Service Plan**: Configurable SKU based on environment
- **Application Insights**: Monitoring and diagnostics
- **Staging Slot**: Optional deployment slot for production environments
- **Custom Domain**: Optional SSL-enabled custom domain support

## State Management

This configuration uses **local state** stored in the `terraform/` directory. State files contain sensitive information and are excluded from version control via `.gitignore`.

**Important Notes:**
- State files are stored locally in `terraform.tfstate`
- Each workspace has its own state file: `terraform.tfstate.d/<workspace>/terraform.tfstate`
- Never commit state files to version control
- For team collaboration, consider using a remote backend (Azure Storage, Terraform Cloud, etc.)
- Backup your state files regularly

## Prerequisites

1. **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Terraform**: [Install Terraform](https://www.terraform.io/downloads) (>= 1.0)
3. **Azure Subscription**: Active Azure subscription with appropriate permissions

## Quick Start

### 1. Configure Environment Variables

Copy and configure the environment file:

```bash
cd terraform
cp environments/dev.tfvars environments/dev.tfvars.local
```

Edit `environments/dev.tfvars.local` and set:
- `azure_subscription_id`: Your Azure subscription ID
- `supabase_anon_key`: Your Supabase anonymous key
- Other configuration as needed

### 2. Deploy to Azure

```bash
# Quick deployment (recommended for first-time setup)
chmod +x scripts/*.sh
./scripts/quick-deploy.sh

# Or use the deployment script directly
./scripts/deploy.sh dev plan    # Review changes
./scripts/deploy.sh dev apply   # Deploy infrastructure
```

## Manual Deployment Steps

If you prefer manual control:

```bash
# Login to Azure
az login

# Initialize Terraform (local backend)
terraform init

# Select workspace
terraform workspace select dev || terraform workspace new dev

# Plan changes
terraform plan -var-file="environments/dev.tfvars.local" -out=dev.tfplan

# Apply changes
terraform apply dev.tfplan

# View outputs
terraform output
```

## Environment Configuration

### Development (`dev.tfvars`)
- SKU: B1 (Basic)
- Staging slot: Disabled
- Always On: Disabled

### Production (`production.tfvars`)
- SKU: P1v2 (Premium)
- Staging slot: Enabled
- Always On: Enabled
- Custom domain support

## App Service SKU Options

| SKU | vCPU | RAM | Price Tier | Use Case |
|-----|------|-----|------------|----------|
| B1  | 1    | 1.75 GB | Basic | Development |
| B2  | 2    | 3.5 GB | Basic | Testing |
| S1  | 1    | 1.75 GB | Standard | Small production |
| P1v2 | 1   | 3.5 GB | Premium | Production |
| P2v2 | 2   | 7 GB | Premium | High traffic |

## Deployment Process

The deployment automatically:
1. Creates Azure resources
2. Configures Node.js 20 LTS runtime
3. Sets environment variables
4. Enables HTTPS-only access
5. Configures logging and monitoring

## Post-Deployment

### Deploy Application Code

After infrastructure is created, deploy your Next.js app:

```bash
cd ../web

# Build the application
npm run build

# Deploy using Azure CLI
az webapp deployment source config-zip \
  --resource-group todoapp-dev-rg \
  --name todoapp-dev-app \
  --src ./build.zip
```

Or use GitHub Actions for CI/CD (see `.github/workflows/` directory).

### Access Application

```bash
# Get the app URL
terraform output app_service_url

# Open in browser
open $(terraform output -raw app_service_url)
```

### View Logs

```bash
# Stream logs
az webapp log tail \
  --resource-group todoapp-dev-rg \
  --name todoapp-dev-app

# Download logs
az webapp log download \
  --resource-group todoapp-dev-rg \
  --name todoapp-dev-app
```

## Custom Domain Setup

1. Update `custom_domain` in your tfvars file
2. Add DNS records pointing to your App Service
3. Run `terraform apply`
4. Managed SSL certificate is automatically provisioned

## Staging Slot Usage

For production environments with staging enabled:

```bash
# Deploy to staging
az webapp deployment source config-zip \
  --resource-group todoapp-production-rg \
  --name todoapp-production-app \
  --slot staging \
  --src ./build.zip

# Test staging
open $(terraform output -raw staging_slot_url)

# Swap staging to production
az webapp deployment slot swap \
  --resource-group todoapp-production-rg \
  --name todoapp-production-app \
  --slot staging \
  --target-slot production
```

## Monitoring

Application Insights is automatically configured. Access metrics:

```bash
# Get instrumentation key
terraform output application_insights_instrumentation_key

# View in Azure Portal
az monitor app-insights component show \
  --app todoapp-dev-insights \
  --resource-group todoapp-dev-rg
```

## Cleanup

To destroy all resources:

```bash
./scripts/deploy.sh dev destroy
```

Or manually:

```bash
terraform destroy -var-file="environments/dev.tfvars"
```

## Troubleshooting

### Build Failures

Check App Service logs:
```bash
az webapp log tail --resource-group todoapp-dev-rg --name todoapp-dev-app
```

### Environment Variables

Verify configuration:
```bash
az webapp config appsettings list \
  --resource-group todoapp-dev-rg \
  --name todoapp-dev-app
```

### Deployment Issues

Check deployment status:
```bash
az webapp deployment list-publishing-profiles \
  --resource-group todoapp-dev-rg \
  --name todoapp-dev-app
```

## Security Best Practices

1. **Never commit sensitive files**:
   - `*.tfvars.local` (contains credentials)
   - `*.tfstate*` (contains sensitive resource data)
   - `*.tfplan` (may contain sensitive data)

2. **Backup state files regularly**:
   - State files are critical for Terraform operations
   - Store backups securely (encrypted storage)
   - Consider using remote backend for team environments

3. **Use Azure Key Vault** for secrets in production

4. **Enable managed identity** for App Service

5. **Configure network restrictions** for production

## State File Management

### Backup State Files

```bash
# Backup current state
cp terraform.tfstate terraform.tfstate.backup-$(date +%Y%m%d)

# Backup workspace state
cp terraform.tfstate.d/dev/terraform.tfstate terraform.tfstate.d/dev/terraform.tfstate.backup-$(date +%Y%m%d)
```

### Migrate to Remote Backend (Optional)

If you need team collaboration, you can migrate to a remote backend:

1. Create Azure Storage account for state
2. Update `main.tf` to add backend configuration
3. Run `terraform init -migrate-state`

Example backend configuration:
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstateXXXXX"
    container_name       = "tfstate"
    key                  = "todoapp.terraform.tfstate"
  }
}
```

## Cost Optimization

- Use B1 SKU for development ($13/month)
- Scale up only when needed
- Enable auto-scaling for production
- Use staging slots only in production
- Monitor costs in Azure Cost Management

## Support

For issues or questions:
- Azure Documentation: https://docs.microsoft.com/azure
- Terraform Azure Provider: https://registry.terraform.io/providers/hashicorp/azurerm

## Additional Documentation

- **[STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)**: Complete guide to local state management, backups, and best practices
- **[REMOTE_BACKEND_MIGRATION.md](REMOTE_BACKEND_MIGRATION.md)**: Step-by-step guide to migrate to Azure Storage backend for team collaboration
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**: Detailed deployment instructions with troubleshooting
