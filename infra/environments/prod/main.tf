module "cloudflare" {
  source = "../../modules/cloudflare"

  zone_id      = var.cloudflare_zone_id
  domain       = var.domain
  tailscale_ip = var.tailscale_ip
  vercel_cname = var.vercel_cname
}
