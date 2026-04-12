output "dns_record_ids" {
  description = "Map of DNS record resource names to their Cloudflare IDs"
  value = {
    root_a_1      = cloudflare_dns_record.root_a_1.id
    root_a_2      = cloudflare_dns_record.root_a_2.id
    www_cname     = cloudflare_dns_record.www_cname.id
    homelab_home  = cloudflare_dns_record.homelab_home.id
    homelab_media = cloudflare_dns_record.homelab_media.id
    homelab_vault = cloudflare_dns_record.homelab_vault.id
    homelab_ha    = cloudflare_dns_record.homelab_ha.id
    mx_primary    = cloudflare_dns_record.mx_primary.id
    mx_alt1       = cloudflare_dns_record.mx_alt1.id
    mx_alt2       = cloudflare_dns_record.mx_alt2.id
    mx_alt3       = cloudflare_dns_record.mx_alt3.id
    mx_alt4       = cloudflare_dns_record.mx_alt4.id
    txt_spf       = cloudflare_dns_record.txt_spf.id
    txt_ms_verify = cloudflare_dns_record.txt_ms_verify.id
  }
}
