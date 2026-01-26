#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Quick Azure Deployment ===${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi
echo "✅ Azure CLI installed"

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found. Install from: https://www.terraform.io/downloads"
    exit 1
fi
echo "✅ Terraform installed"

if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure"
    echo "Run: az login"
    exit 1
fi
echo "✅ Logged in to Azure"

# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "✅ Using subscription: $SUBSCRIPTION_ID"

# Check if environment file exists
if [ ! -f "environments/dev.tfvars.local" ]; then
    echo ""
    echo -e "${YELLOW}Creating dev environment configuration...${NC}"
    cp environments/dev.tfvars environments/dev.tfvars.local
    
    # Update subscription ID
    sed -i.bak "s/your-subscription-id-here/$SUBSCRIPTION_ID/" environments/dev.tfvars.local
    rm environments/dev.tfvars.local.bak
    
    echo ""
    echo "⚠️  Please edit environments/dev.tfvars.local and add your Supabase credentials"
    echo "Then run this script again"
    exit 0
fi

# Deploy infrastructure
echo ""
echo -e "${YELLOW}Deploying infrastructure...${NC}"
./scripts/deploy.sh dev apply

# Get outputs
echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
terraform output

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Build your application: cd ../web && npm run build"
echo "2. Deploy code: See DEPLOYMENT_GUIDE.md for instructions"
echo ""
echo "App URL: $(terraform output -raw app_service_url)"
