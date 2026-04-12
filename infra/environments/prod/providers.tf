terraform {
  cloud {
    organization = "priceless-dev"
    workspaces {
      name = "if-prod"
    }
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.6"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
