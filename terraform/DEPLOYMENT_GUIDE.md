# Azure Deployment Guide

Complete step-by-step guide to deploy your Next.js application to Azure.

## Prerequisites Checklist

- [ ] Azure account with active subscription
- [ ] Azure CLI installed and configured
- [ ] Terraform installed (>= 1.0)
- [ ] Git repository access
- [ ] Supabase project credentials

## Step 1: Azure Setup

### 1.1 Install Azure CLI

**macOS:**
```bash
brew install azure-cli
```

**Verify installation:**
```bash
az --version
```

### 1.2 Login to Azure

```bash
az login
```

This opens a browser for authentication. After login, you'll see your subscriptions.

### 1.3 Set Active Subscription

```bash
# List subscriptions
az account list --output table

# Set active subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify
az account show
```

## Step 2: Configure Environment

### 2.1 Get Azure Subscription ID

```bash
az account show --query id -o tsv
```

### 2.2 Configure Development Environment

```bash
cp environments/dev.tfvars environments/dev.tfvars.local
```

Edit `environments/dev.tfvars.local`:

```hcl
azure_subscription_id = "YOUR_SUBSCRIPTION_ID"
project_name = "todoapp"
environment  = "dev"
location     = "eastus"
app_service_sku = "B1"

supabase_url      = "https://tuaerfuuqnsrlajquhge.supabase.co"
supabase_anon_key = "YOUR_SUPABASE_ANON_KEY"

enable_staging_slot = false
custom_domain       = ""

tags = {
  Environment = "Development"
  Owner       = "Your Name"
}
```

## Step 3: Deploy Infrastructure

### 3.1 Initialize Terraform

```bash
cd terraform
terraform init
```

Expected output:
```
Terraform has been successfully initialized!
```

**Note:** State files will be stored locally in the `terraform/` directory. Make sure to backup these files regularly.

### 3.2 Create Workspace

```bash
terraform workspace new dev
```

Or select existing:
```bash
terraform workspace select dev
```

### 3.3 Plan Deployment

```bash
terraform plan -var-file="environments/dev.tfvars.local" -out=dev.tfplan
```

Review the plan carefully. You should see resources to be created:
- Resource group
- App Service Plan
- App Service (Web App)
- Application Insights
- Optional: Staging slot, custom domain

### 3.4 Apply Deployment

```bash
terraform apply dev.tfplan
```

This takes 2-5 minutes. After completion, you'll see outputs:

```
Outputs:

app_service_name = "todoapp-dev-app"
app_service_url = "https://todoapp-dev-app.azurewebsites.net"
resource_group_name = "todoapp-dev-rg"
```

### 3.5 Save Outputs

```bash
terraform output > deployment-info.txt
```

## Step 4: Deploy Application Code

### 4.1 Build Application

```bash
cd ../web
npm install
npm run build
```

### 4.2 Create Deployment Package

```bash
# Copy necessary files to standalone build
cp package.json package-lock.json .next/standalone/
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Create zip
cd .next/standalone
zip -r ../../deploy.zip .
cd ../..
```

### 4.3 Deploy to Azure

```bash
# Get resource details from Terraform
RESOURCE_GROUP=$(cd ../terraform && terraform output -raw resource_group_name)
APP_NAME=$(cd ../terraform && terraform output -raw app_service_name)

# Deploy
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src deploy.zip
```

### 4.4 Verify Deployment

```bash
# Get app URL
APP_URL=$(cd ../terraform && terraform output -raw app_service_url)

# Open in browser
open $APP_URL

# Or check status
az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --query state
```

## Step 5: Configure Environment Variables

If you need to update environment variables:

```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    NEXT_PUBLIC_SUPABASE_URL="https://tuaerfuuqnsrlajquhge.supabase.co" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key-here"
```

## Step 6: Monitor Application

### 6.1 Stream Logs

```bash
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME
```

### 6.2 View Application Insights

```bash
# Get instrumentation key
cd ../terraform
terraform output application_insights_instrumentation_key

# Open in Azure Portal
az monitor app-insights component show \
  --app todoapp-dev-insights \
  --resource-group $RESOURCE_GROUP
```

### 6.3 Check Health

```bash
curl -I $APP_URL
```

Should return `HTTP/1.1 200 OK`

## Step 7: Setup CI/CD (Optional)

### 7.1 Configure GitHub Secrets

In your GitHub repository, add these secrets:

1. **AZURE_CREDENTIALS**: Service principal credentials
2. **AZURE_SUBSCRIPTION_ID**: Your subscription ID
3. **SUPABASE_URL**: Supabase project URL
4. **SUPABASE_ANON_KEY**: Supabase anonymous key

### 7.2 Create Service Principal

```bash
az ad sp create-for-rbac \
  --name "todoapp-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth
```

Copy the JSON output to GitHub secret `AZURE_CREDENTIALS`.

### 7.3 Test Workflow

Push to your repository:
```bash
git add .
git commit -m "Add Azure deployment"
git push origin main
```

Check GitHub Actions tab for deployment status.

**Note:** The GitHub Actions workflow uses local state which is not ideal for CI/CD. For production CI/CD pipelines, consider migrating to a remote backend (Azure Storage) to share state across workflow runs.

## Production Deployment

### Configure Production Environment

```bash
cd terraform
cp environments/production.tfvars environments/production.tfvars.local
```

Edit with production settings:
```hcl
environment  = "production"
app_service_sku = "P1v2"
enable_staging_slot = true
custom_domain = "app.yourdomain.com"
```

### Deploy Production

```bash
# Create production workspace
terraform workspace new production

# Plan
terraform plan -var-file="environments/production.tfvars.local" -out=prod.tfplan

# Apply
terraform apply prod.tfplan
```

## Troubleshooting

### Issue: Terraform Init Fails

**Solution:**
```bash
# Clear cache
rm -rf .terraform
rm .terraform.lock.hcl

# Reinitialize
terraform init
```

### Issue: State File Conflicts

**Solution:**
```bash
# If state is corrupted, restore from backup
cp terraform.tfstate.backup terraform.tfstate

# Or for workspace state
cp terraform.tfstate.d/dev/terraform.tfstate.backup terraform.tfstate.d/dev/terraform.tfstate
```

### Issue: Deployment Package Too Large

**Solution:**
```bash
# Exclude node_modules from zip
cd .next/standalone
zip -r ../../deploy.zip . -x "node_modules/*"
```

### Issue: App Not Starting

**Check logs:**
```bash
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME
```

**Common fixes:**
- Verify Node.js version in App Service
- Check environment variables
- Ensure build completed successfully

### Issue: Database Connection Fails

**Verify Supabase settings:**
```bash
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --query "[?name=='NEXT_PUBLIC_SUPABASE_URL']"
```

## Cost Management

### Monitor Costs

```bash
az consumption usage list \
  --start-date 2026-01-01 \
  --end-date 2026-01-31
```

### Estimated Monthly Costs

- **B1 (Dev)**: ~$13/month
- **S1 (Staging)**: ~$70/month
- **P1v2 (Production)**: ~$150/month

### Cost Optimization Tips

1. Stop dev environments when not in use
2. Use auto-scaling for production
3. Enable Application Insights sampling
4. Use reserved instances for production

## Cleanup

### Remove Application

```bash
cd terraform
terraform workspace select dev
terraform destroy -var-file="environments/dev.tfvars.local"
```

### Remove State Files

After destroying resources, you can remove state files:

```bash
# Remove workspace state
rm -rf terraform.tfstate.d/

# Remove default state (if used)
rm -f terraform.tfstate terraform.tfstate.backup
```

**Warning:** Only remove state files after successfully destroying all resources. If you remove state files while resources still exist, Terraform will lose track of them and you'll need to manually delete resources from Azure Portal.

## Next Steps

- [ ] Configure custom domain
- [ ] Setup SSL certificate
- [ ] Configure auto-scaling
- [ ] Setup monitoring alerts
- [ ] Configure backup strategy
- [ ] Implement blue-green deployment
- [ ] Setup Azure CDN for static assets

## Support Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
