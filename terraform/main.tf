terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Using local backend - state files stored in terraform/ directory
  # IMPORTANT: Add *.tfstate* to .gitignore to avoid committing sensitive data
}

provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription_id
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = local.common_tags
}

# App Service Plan (Linux)
resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-${var.environment}-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  tags = local.common_tags
}

# App Service (Web App)
resource "azurerm_linux_web_app" "main" {
  name                = "${var.project_name}-${var.environment}-app"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = var.environment == "production" ? true : false
    
    application_stack {
      node_version = "20-lts"
    }

    app_command_line = "npm run start"
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    "NEXT_PUBLIC_SUPABASE_URL"       = var.supabase_url
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"  = var.supabase_anon_key
    "NODE_ENV"                       = var.environment == "production" ? "production" : "development"
  }

  https_only = true

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true
    
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = local.common_tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "Node.JS"

  tags = local.common_tags
}

# Configure App Insights for Web App
resource "azurerm_linux_web_app_slot" "staging" {
  count          = var.enable_staging_slot ? 1 : 0
  name           = "staging"
  app_service_id = azurerm_linux_web_app.main.id

  site_config {
    always_on = false
    
    application_stack {
      node_version = "20-lts"
    }

    app_command_line = "npm run start"
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    "NEXT_PUBLIC_SUPABASE_URL"       = var.supabase_url
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"  = var.supabase_anon_key
    "NODE_ENV"                       = "staging"
  }

  https_only = true

  tags = local.common_tags
}

# Custom Domain (Optional)
resource "azurerm_app_service_custom_hostname_binding" "main" {
  count               = var.custom_domain != "" ? 1 : 0
  hostname            = var.custom_domain
  app_service_name    = azurerm_linux_web_app.main.name
  resource_group_name = azurerm_resource_group.main.name

  depends_on = [azurerm_linux_web_app.main]
}

# Managed Certificate for Custom Domain
resource "azurerm_app_service_managed_certificate" "main" {
  count                      = var.custom_domain != "" ? 1 : 0
  custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.main[0].id
}

# SSL Binding for Custom Domain
resource "azurerm_app_service_certificate_binding" "main" {
  count               = var.custom_domain != "" ? 1 : 0
  hostname_binding_id = azurerm_app_service_custom_hostname_binding.main[0].id
  certificate_id      = azurerm_app_service_managed_certificate.main[0].id
  ssl_state           = "SniEnabled"
}
