#!/bin/bash
set -e

echo "🚀 Deploying Next.js App to Azure Static Web Apps"
echo ""

# Check prerequisites
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed."; exit 1; }
command -v az >/dev/null 2>&1 || { echo "❌ Azure CLI is required but not installed."; exit 1; }

# Check Azure login
if ! az account show >/dev/null 2>&1; then
    echo "❌ Not logged in to Azure. Run: az login"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Deploy infrastructure
echo "📦 Deploying infrastructure with Terraform..."
cd terraform
terraform init
terraform apply -auto-approve

echo ""
echo "✅ Infrastructure deployed successfully!"
echo ""

# Get outputs
API_KEY=$(terraform output -raw api_key)
APP_URL=$(terraform output -raw static_web_app_url)

echo "🌐 Application URL: $APP_URL"
echo ""
echo "🔑 Next steps:"
echo "1. Add this API key as a GitHub secret named 'AZURE_STATIC_WEB_APPS_API_TOKEN':"
echo "   $API_KEY"
echo ""
echo "2. Push your code to GitHub main branch"
echo "3. GitHub Actions will automatically deploy your app"
echo ""
echo "✨ Deployment complete!"
