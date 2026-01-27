terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "8db703d9-3a2c-49a9-9f7f-48fb8aa55aed"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-nextjs-app"
  location = "West Europe"
}

resource "azurerm_static_web_app" "main" {
  name                = "swa-nextjs-app"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku_tier            = "Free"
  sku_size            = "Free"
}

output "static_web_app_url" {
  value       = "https://${azurerm_static_web_app.main.default_host_name}"
  description = "Public URL for the deployed application"
}

output "api_key" {
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
  description = "API key for GitHub Actions deployment"
}
