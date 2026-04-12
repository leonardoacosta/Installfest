variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for leonardoacosta.dev"
  type        = string
}

variable "domain" {
  description = "Root domain"
  type        = string
  default     = "leonardoacosta.dev"
}

variable "tailscale_ip" {
  description = "Tailscale IP for homelab services"
  type        = string
  default     = "100.94.11.104"
}

variable "vercel_cname" {
  description = "Vercel CNAME target for apex and www"
  type        = string
  default     = "30eef0a6b09f641c.vercel-dns-017.com"
}
