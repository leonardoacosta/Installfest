terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

# Cloudflare DNS records for leonardoacosta.dev
#
# All records declared here correspond to live DNS entries
# and should be imported into state before the first apply.

# -----------------------------------------------------------------------------
# Root domain A records (Vercel anycast)
# -----------------------------------------------------------------------------

resource "cloudflare_dns_record" "root_a_1" {
  zone_id = var.zone_id
  name    = var.domain
  type    = "A"
  content = var.vercel_ips[0]
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "root_a_2" {
  zone_id = var.zone_id
  name    = var.domain
  type    = "A"
  content = var.vercel_ips[1]
  ttl     = 1
  proxied = true
}

# -----------------------------------------------------------------------------
# www CNAME (Vercel)
# -----------------------------------------------------------------------------

resource "cloudflare_dns_record" "www_cname" {
  zone_id = var.zone_id
  name    = "www"
  type    = "CNAME"
  content = var.vercel_cname
  ttl     = 1
  proxied = true
}

# -----------------------------------------------------------------------------
# Homelab A records (Tailscale IP, DNS-only)
# -----------------------------------------------------------------------------

resource "cloudflare_dns_record" "homelab_home" {
  zone_id = var.zone_id
  name    = "home"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_media" {
  zone_id = var.zone_id
  name    = "media"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_vault" {
  zone_id = var.zone_id
  name    = "vault"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_ha" {
  zone_id = var.zone_id
  name    = "ha"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

# -----------------------------------------------------------------------------
# MX records (Google Workspace)
# -----------------------------------------------------------------------------

resource "cloudflare_dns_record" "mx_primary" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "aspmx.l.google.com"
  priority = 1
  ttl      = 1
}

resource "cloudflare_dns_record" "mx_alt1" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt1.aspmx.l.google.com"
  priority = 5
  ttl      = 1
}

resource "cloudflare_dns_record" "mx_alt2" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt2.aspmx.l.google.com"
  priority = 5
  ttl      = 1
}

resource "cloudflare_dns_record" "mx_alt3" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt3.aspmx.l.google.com"
  priority = 10
  ttl      = 1
}

resource "cloudflare_dns_record" "mx_alt4" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt4.aspmx.l.google.com"
  priority = 10
  ttl      = 1
}

# -----------------------------------------------------------------------------
# TXT records
# -----------------------------------------------------------------------------

resource "cloudflare_dns_record" "txt_spf" {
  zone_id = var.zone_id
  name    = var.domain
  type    = "TXT"
  content = "v=spf1 include:_spf.google.com ~all"
  ttl     = 1
}

resource "cloudflare_dns_record" "txt_ms_verify" {
  zone_id = var.zone_id
  name    = var.domain
  type    = "TXT"
  content = "MS=ms49157702"
  ttl     = 1
}
