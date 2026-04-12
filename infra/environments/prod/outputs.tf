output "zone_id" {
  description = "Cloudflare zone ID"
  value       = var.cloudflare_zone_id
  sensitive   = true
}

output "dns_records" {
  description = "Map of managed DNS record IDs"
  value       = module.cloudflare.dns_record_ids
}
