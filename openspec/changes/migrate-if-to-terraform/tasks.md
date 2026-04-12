# Implementation Tasks

<!-- beads:epic:if-53w -->

## Infra Bootstrap Batch

- [ ] [1.1] [P-1] Create TF Cloud workspace `if-prod` (CLI-driven, Local execution mode) [owner:user] [beads:if-9y9]
- [x] [1.2] [P-1] Scaffold `infra/environments/prod/` and `infra/modules/cloudflare/` directory tree [owner:infra-engineer] [beads:if-tpc]
- [x] [1.3] [P-1] Add `"tf": "./infra/scripts/tf.sh"` to root `package.json` scripts [owner:infra-engineer] [beads:if-v4x]
- [x] [1.4] [P-1] Add `infra/.secrets.env` and `infra/.tf-outputs.env` to `.gitignore` [owner:infra-engineer] [beads:if-hg7]

## Terraform Config Batch

- [x] [2.1] [P-1] Write `infra/environments/prod/providers.tf` (TF Cloud backend `if-prod`, cloudflare ~> 5.0 only) [owner:infra-engineer] [beads:if-sl6]
- [x] [2.2] [P-1] Write `infra/environments/prod/variables.tf` and `terraform.tfvars` (non-sensitive defaults) [owner:infra-engineer] [beads:if-4g3]
- [x] [2.3] [P-1] Write `infra/modules/cloudflare/main.tf` with `cloudflare_dns_record` resources for all existing `leonardoacosta.dev` records [owner:infra-engineer] [beads:if-d42]
- [x] [2.4] [P-1] Write `infra/modules/cloudflare/variables.tf` and `outputs.tf` [owner:infra-engineer] [beads:if-txc]
- [x] [2.5] [P-1] Write `infra/environments/prod/main.tf` instantiating the cloudflare module [owner:infra-engineer] [beads:if-9rg]
- [x] [2.6] [P-1] Write `infra/environments/prod/outputs.tf` (surface zone_id and any deploy-hook values) [owner:infra-engineer] [beads:if-6hg]
- [x] [2.7] [P-1] Write `infra/scripts/tf.sh` (secrets bootstrap, auth check, env dispatch, .tf-outputs.env write on apply) [owner:infra-engineer] [beads:if-jbn]

## Import + Validate Batch

- [ ] [3.1] [P-1] Run `pnpm tf init` — verify TF Cloud workspace connects [owner:infra-engineer] [beads:if-qup]
- [ ] [3.2] [P-1] Run `pnpm tf plan` dry run — confirm no errors before any import [owner:infra-engineer] [beads:if-t2s]
- [ ] [3.3] [P-1] Import all existing Cloudflare DNS records via `terraform import` (zero destroys required) [owner:infra-engineer] [beads:if-5wp]
- [ ] [3.4] [P-1] Run `pnpm tf apply prod` — verify plan shows 0 destroys, apply succeeds [owner:infra-engineer] [beads:if-2da]
- [ ] [3.5] [P-2] Wire `infra/.tf-outputs.env` sourcing into the git post-receive deploy hook [owner:infra-engineer] [beads:if-yd6]
