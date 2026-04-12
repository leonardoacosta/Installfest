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
#
# Source of truth: Cloudflare API (42 records total, minus 4 apex NS
# records that Cloudflare manages internally and cannot be Terraformed).

# -----------------------------------------------------------------------------
# Homelab A records (Tailscale IP, DNS-only)
# -----------------------------------------------------------------------------

resource "cloudflare_dns_record" "homelab_ai" {
  zone_id = var.zone_id
  name    = "ai.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_cl" {
  zone_id = var.zone_id
  name    = "cl.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
  comment = "Central Leo - Tailscale only (homelab Docker)"
}

resource "cloudflare_dns_record" "homelab_co" {
  zone_id = var.zone_id
  name    = "co.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_cw" {
  zone_id = var.zone_id
  name    = "cw.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_cxl" {
  zone_id = var.zone_id
  name    = "cxl.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
  comment = "Cortex cxl - Tailscale only (homelab Docker)"
}

resource "cloudflare_dns_record" "homelab_cxo" {
  zone_id = var.zone_id
  name    = "cxo.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
  comment = "Cortex cxo - Tailscale only (homelab Docker)"
}

resource "cloudflare_dns_record" "homelab_cxw" {
  zone_id = var.zone_id
  name    = "cxw.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
  comment = "Cortex cxw - Tailscale only (homelab Docker)"
}

resource "cloudflare_dns_record" "homelab_dash" {
  zone_id = var.zone_id
  name    = "dash.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_deploy" {
  zone_id = var.zone_id
  name    = "deploy.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_fin" {
  zone_id = var.zone_id
  name    = "fin.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_glance" {
  zone_id = var.zone_id
  name    = "glance.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_ha" {
  zone_id = var.zone_id
  name    = "ha.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_wildcard_home" {
  zone_id = var.zone_id
  name    = "*.home.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_home" {
  zone_id = var.zone_id
  name    = "home.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_mb" {
  zone_id = var.zone_id
  name    = "mb.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_media" {
  zone_id = var.zone_id
  name    = "media.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_nexus" {
  zone_id = var.zone_id
  name    = "nexus.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 120
  proxied = false
  comment = "Nexus agent — internal Tailscale mesh (not proxied)"
}

resource "cloudflare_dns_record" "homelab_nova" {
  zone_id = var.zone_id
  name    = "nova.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_pg" {
  zone_id = var.zone_id
  name    = "pg.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 300
  proxied = false
  comment = "homelab-postgres (Tailscale only)"
}

resource "cloudflare_dns_record" "homelab_photos" {
  zone_id = var.zone_id
  name    = "photos.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_seer" {
  zone_id = var.zone_id
  name    = "seer.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "homelab_vault" {
  zone_id = var.zone_id
  name    = "vault.leonardoacosta.dev"
  type    = "A"
  content = var.tailscale_ip
  ttl     = 1
  proxied = false
}

# -----------------------------------------------------------------------------
# CNAME records
# -----------------------------------------------------------------------------

resource "cloudflare_dns_record" "coolify_cname" {
  zone_id = var.zone_id
  name    = "coolify.leonardoacosta.dev"
  type    = "CNAME"
  content = "9ce2191f-9b6a-4f8a-b2b3-b0ed25ad32e3.cfargotunnel.com"
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "root_cname" {
  zone_id = var.zone_id
  name    = var.domain
  type    = "CNAME"
  content = var.vercel_cname
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "www_cname" {
  zone_id = var.zone_id
  name    = "www.leonardoacosta.dev"
  type    = "CNAME"
  content = var.vercel_cname
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
  proxied  = false
}

resource "cloudflare_dns_record" "mx_alt1" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt1.aspmx.l.google.com"
  priority = 5
  ttl      = 1
  proxied  = false
}

resource "cloudflare_dns_record" "mx_alt2" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt2.aspmx.l.google.com"
  priority = 5
  ttl      = 1
  proxied  = false
}

resource "cloudflare_dns_record" "mx_alt3" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt3.aspmx.l.google.com"
  priority = 10
  ttl      = 1
  proxied  = false
}

resource "cloudflare_dns_record" "mx_alt4" {
  zone_id  = var.zone_id
  name     = var.domain
  type     = "MX"
  content  = "alt4.aspmx.l.google.com"
  priority = 10
  ttl      = 1
  proxied  = false
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
  proxied = false
}

resource "cloudflare_dns_record" "txt_ms_verify" {
  zone_id = var.zone_id
  name    = var.domain
  type    = "TXT"
  content = "MS=ms49157702"
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "txt_dkim_google" {
  zone_id = var.zone_id
  name    = "google._domainkey.leonardoacosta.dev"
  type    = "TXT"
  content = "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt3CzgAZI0SsAl9+/fYXqT6kr9fdlT6MwVrXvKheWO+Rq9IP0SVNmeUjPRDFuD33uBTWe/hBwZBYzeudj+fBEbcjHGNSCLKy2W1Xmb7fpH3IzJ/Ez/HuTzc05wgDzY1ZYreJqb9ZLXqwn7b8EmIw07GwQBhwXaIgiwLS3zNR6qq9AmrN7Q6krkEbFgIIYzUYP+IdfMHndvy0OIY9CD+mfDSoUTyll2MVfwOqueMSL6n+Hk1L8O4ZcPYSArdWzIvvemClJIa2RyMTF1lovnn7Nnp7Nt283GhAd9x8VCCvMtlJF3y9bPjLORQTOuM01Xov2EzN9CnLPJpTif20yuPvIzQIDAQAB"
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "txt_acme_home_1" {
  zone_id = var.zone_id
  name    = "_acme-challenge.home.leonardoacosta.dev"
  type    = "TXT"
  content = "J2GS-BeawJ0DkUvHBQDqQyGlIs2LRQs0zPlQjmc0K3U"
  ttl     = 120
  proxied = false
}

resource "cloudflare_dns_record" "txt_acme_home_2" {
  zone_id = var.zone_id
  name    = "_acme-challenge.home.leonardoacosta.dev"
  type    = "TXT"
  content = "IJ4t1uWSGZZ46ZwzX688cUqo_yJazQZMasORfbDm_HQ"
  ttl     = 120
  proxied = false
}

resource "cloudflare_dns_record" "txt_vercel_root" {
  zone_id = var.zone_id
  name    = "_vercel.leonardoacosta.dev"
  type    = "TXT"
  content = "vc-domain-verify=leonardoacosta.dev,6a68017afa60b3053c1d,dc"
  ttl     = 600
  proxied = false
}

resource "cloudflare_dns_record" "txt_vercel_www" {
  zone_id = var.zone_id
  name    = "_vercel.leonardoacosta.dev"
  type    = "TXT"
  content = "vc-domain-verify=www.leonardoacosta.dev,f1a09326d64b3ca6152b,dc"
  ttl     = 600
  proxied = false
}
