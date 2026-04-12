# Proposal: Migrate if to Terraform

## Change ID
`migrate-if-to-terraform`

## Summary
Add a minimal Terraform configuration under `infra/` that brings the project's Cloudflare DNS records for `leonardoacosta.dev` under Infrastructure-as-Code, backed by Terraform Cloud state, and wired into the existing git-hook deploy workflow via `pnpm tf *` at the repo root.

## Context
- Extends: root `package.json` (add `tf` script), `.gitignore` (add `infra/.secrets.env`, `infra/.tf-outputs.env`)
- Related: archived spec `add-smart-az-wrapper` (established pattern for credential isolation in this repo)
- Infrastructure: Cloudflare zone `leonardoacosta.dev` (zone ID in `.env`), git-hook push+pull deploy on homelab `omarchy`
- No Vercel, no Tailscale provider needed

## Motivation
DNS records for `leonardoacosta.dev` are currently managed manually through the Cloudflare dashboard. Any homelab service addition requires a manual UI step with no audit trail, no review, and no rollback. Bringing these records into Terraform means every DNS change is a reviewed git commit, state is safely stored in Terraform Cloud with full history, and the same `pnpm tf plan / apply` workflow used by other homelab projects (nv, nx, hl, cx) applies here.

## Requirements

### Req-1: infra/ directory structure (prod only)
Scaffold the standard self-hosted layout with a single `prod/` environment root and no `dev/` environment, matching the guide's self-hosted pattern:

```
infra/
├── environments/
│   └── prod/
│       ├── main.tf
│       ├── providers.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
├── modules/
│   └── cloudflare/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── scripts/
    └── tf.sh
```

### Req-2: Terraform Cloud backend (`if-prod` workspace)
`providers.tf` uses the `cloud {}` backend pointing to the `leonardo-acosta` Terraform Cloud org with workspace `if-prod`. Execution mode must be set to **Local** in the TF Cloud UI so state is stored remotely but apply runs locally.

### Req-3: Cloudflare provider only
`required_providers` declares only `cloudflare/cloudflare ~> 5.0`. No Vercel, no Tailscale, no Neon — this project has no managed compute to wire up.

### Req-4: Secrets bootstrapped via `.secrets.env`
`tf.sh` generates `infra/.secrets.env` on first run with a placeholder for `TF_VAR_cloudflare_api_token`. File is `chmod 600` and gitignored. The Cloudflare API token and zone ID are already present in the repo's `.env` file — `.secrets.env` provides the `TF_VAR_`-prefixed form Terraform expects.

### Req-5: pnpm tf * from repo root
Root `package.json` gains a `"tf": "./infra/scripts/tf.sh"` script so `pnpm tf plan`, `pnpm tf apply`, etc. work from any directory in the repo without `cd`.

### Req-6: Import existing DNS records
Existing Cloudflare DNS records for `leonardoacosta.dev` must be imported via `terraform import` rather than destroyed and recreated. This is non-negotiable — re-creating live DNS records causes downtime.

### Req-7: outputs.tf + .tf-outputs.env for deploy hook
`environments/prod/outputs.tf` emits any values the deploy hook needs. `tf.sh apply` writes these to `infra/.tf-outputs.env` (gitignored, `chmod 600`) using `terraform output -json | jq`. The git post-receive hook sources this file.

## Scope
- **IN**: `infra/` directory, Cloudflare DNS module, Terraform Cloud backend, `pnpm tf *` root script, `.secrets.env` bootstrap, import of existing DNS records, `.tf-outputs.env` wiring
- **OUT**: Tailscale ACL management (no tailscale provider needed for `if`), Docker/container lifecycle management, Vercel configuration, any dev Terraform environment, migration of other secrets managers (Doppler stays as-is)

## Impact
| Area | Change |
|------|--------|
| `package.json` | Add `"tf"` script pointing to `infra/scripts/tf.sh` |
| `.gitignore` | Add `infra/.secrets.env` and `infra/.tf-outputs.env` |
| `infra/` (new) | Full Terraform module tree for Cloudflare DNS |
| Cloudflare DNS | No changes to live records — import only, no recreation |
| Terraform Cloud | New `if-prod` workspace created (manual step) |

## Risks
| Risk | Mitigation |
|------|-----------|
| Existing DNS records destroyed on first apply | Strict import-first rule: run `terraform import` for all records before any `terraform apply`; verify plan shows zero destroys |
| `.secrets.env` committed accidentally | Added to `.gitignore` before any `terraform init`; chezmoi source dir already has a `.gitignore` |
| TF Cloud workspace not set to Local execution | Document as explicit `[user]` task in tasks.md; Local mode must be confirmed before first apply |
| Zone ID / API token mismatch | `terraform plan` will fail fast with a 403 — no state corruption |
