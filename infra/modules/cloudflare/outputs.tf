output "dns_record_ids" {
  description = "Map of DNS record resource names to their Cloudflare IDs"
  value = {
    # Homelab A records
    homelab_ai            = cloudflare_dns_record.homelab_ai.id
    homelab_cl            = cloudflare_dns_record.homelab_cl.id
    homelab_co            = cloudflare_dns_record.homelab_co.id
    homelab_cw            = cloudflare_dns_record.homelab_cw.id
    homelab_cxl           = cloudflare_dns_record.homelab_cxl.id
    homelab_cxo           = cloudflare_dns_record.homelab_cxo.id
    homelab_cxw           = cloudflare_dns_record.homelab_cxw.id
    homelab_dash          = cloudflare_dns_record.homelab_dash.id
    homelab_deploy        = cloudflare_dns_record.homelab_deploy.id
    homelab_fin           = cloudflare_dns_record.homelab_fin.id
    homelab_glance        = cloudflare_dns_record.homelab_glance.id
    homelab_ha            = cloudflare_dns_record.homelab_ha.id
    homelab_wildcard_home = cloudflare_dns_record.homelab_wildcard_home.id
    homelab_home          = cloudflare_dns_record.homelab_home.id
    homelab_mb            = cloudflare_dns_record.homelab_mb.id
    homelab_media         = cloudflare_dns_record.homelab_media.id
    homelab_nexus         = cloudflare_dns_record.homelab_nexus.id
    homelab_nova          = cloudflare_dns_record.homelab_nova.id
    homelab_pg            = cloudflare_dns_record.homelab_pg.id
    homelab_photos        = cloudflare_dns_record.homelab_photos.id
    homelab_seer          = cloudflare_dns_record.homelab_seer.id
    homelab_vault         = cloudflare_dns_record.homelab_vault.id

    # CNAME records
    coolify_cname = cloudflare_dns_record.coolify_cname.id
    root_cname    = cloudflare_dns_record.root_cname.id
    www_cname     = cloudflare_dns_record.www_cname.id

    # MX records
    mx_primary = cloudflare_dns_record.mx_primary.id
    mx_alt1    = cloudflare_dns_record.mx_alt1.id
    mx_alt2    = cloudflare_dns_record.mx_alt2.id
    mx_alt3    = cloudflare_dns_record.mx_alt3.id
    mx_alt4    = cloudflare_dns_record.mx_alt4.id

    # TXT records
    txt_spf         = cloudflare_dns_record.txt_spf.id
    txt_ms_verify   = cloudflare_dns_record.txt_ms_verify.id
    txt_dkim_google = cloudflare_dns_record.txt_dkim_google.id
    txt_acme_home_1 = cloudflare_dns_record.txt_acme_home_1.id
    txt_acme_home_2 = cloudflare_dns_record.txt_acme_home_2.id
    txt_vercel_root = cloudflare_dns_record.txt_vercel_root.id
    txt_vercel_www  = cloudflare_dns_record.txt_vercel_www.id
  }
}
