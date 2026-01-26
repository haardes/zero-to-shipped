#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

echo -e "${GREEN}=== Azure Deployment Script ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    echo "Install from: https://www.terraform.io/downloads"
    exit 1
fi

# Check if logged in to Azure
echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Logging in...${NC}"
    az login
fi

# Show current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}Using Azure subscription: $SUBSCRIPTION${NC}"

# Initialize Terraform (local backend)
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

# Select or create workspace
echo -e "${YELLOW}Selecting workspace: $ENVIRONMENT${NC}"
terraform workspace select $ENVIRONMENT || terraform workspace new $ENVIRONMENT

# Validate configuration
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
terraform validate

# Run Terraform action
case $ACTION in
    plan)
        echo -e "${YELLOW}Running Terraform plan...${NC}"
        terraform plan -var-file="environments/${ENVIRONMENT}.tfvars" -out="${ENVIRONMENT}.tfplan"
        ;;
    apply)
        echo -e "${YELLOW}Applying Terraform changes...${NC}"
        if [ -f "${ENVIRONMENT}.tfplan" ]; then
            terraform apply "${ENVIRONMENT}.tfplan"
            rm "${ENVIRONMENT}.tfplan"
        else
            terraform apply -var-file="environments/${ENVIRONMENT}.tfvars" -auto-approve
        fi
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        terraform output
        ;;
    destroy)
        echo -e "${RED}WARNING: This will destroy all resources!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            terraform destroy -var-file="environments/${ENVIRONMENT}.tfvars"
        else
            echo "Destroy cancelled"
        fi
        ;;
    *)
        echo -e "${RED}Invalid action: $ACTION${NC}"
        echo "Usage: $0 <environment> <plan|apply|destroy>"
        exit 1
        ;;
esac

echo -e "${GREEN}Done!${NC}"
