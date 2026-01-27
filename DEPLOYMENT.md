# Azure Deployment Guide

## Overview
This Next.js application is configured for deployment to Azure Static Web Apps with a public URL accessible from anywhere.

## Prerequisites
- Azure CLI installed and authenticated
- Terraform installed
- GitHub repository for the application

## Deployment Steps

### 1. Deploy Infrastructure with Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

After deployment, note the outputs:
- `static_web_app_url`: Your public application URL
- `api_key`: Required for GitHub Actions (retrieve with `terraform output -raw api_key`)

### 2. Configure GitHub Actions

Create `.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/web"
          output_location: ""

  close_pull_request:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request
    steps:
      - name: Close Pull Request
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
```

### 3. Add GitHub Secret

Add the API key as a GitHub secret:
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. New repository secret
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: (paste the api_key from Terraform output)

### 4. Deploy

Push to main branch:
```bash
git add .
git commit -m "Configure Azure deployment"
git push origin main
```

GitHub Actions will automatically build and deploy your application.

## Environment Variables

If your app requires environment variables (e.g., Supabase credentials), add them in Azure Portal:
1. Go to your Static Web App resource
2. Settings → Configuration
3. Add application settings

## Access Your Application

Once deployed, access your application at the URL from `static_web_app_url` output.

## Cost

This deployment uses the Free tier of Azure Static Web Apps:
- No cost for basic usage
- Includes 100 GB bandwidth per month
- Custom domains supported
- Automatic SSL certificates

## Clean Up

To remove all resources:
```bash
cd terraform
terraform destroy
```
