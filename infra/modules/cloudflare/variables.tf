variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "domain" {
  description = "Root domain name"
  type        = string
}

variable "tailscale_ip" {
  description = "Tailscale IP for homelab services"
  type        = string
}

variable "vercel_cname" {
  description = "Vercel CNAME target for apex and www"
  type        = string
}
