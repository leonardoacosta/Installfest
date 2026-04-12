# Spec: Cloudflare DNS under Terraform

## ADDED Requirements

### Requirement: DNS records for leonardoacosta.dev declared in HCL

All existing Cloudflare DNS records for the `leonardoacosta.dev` zone must be declared as
`cloudflare_dns_record` resources in `infra/modules/cloudflare/main.tf` and imported into
Terraform state before any apply is run.

#### Scenario: Plan shows zero destroys after import

Given all existing DNS records have been imported via `terraform import`,
When `pnpm tf plan` is run,
Then the plan output shows `0 to destroy` for all `cloudflare_dns_record` resources.

#### Scenario: New DNS record added via HCL

Given a homelab service needs a new DNS A or CNAME record,
When the developer adds a `cloudflare_dns_record` block in `modules/cloudflare/main.tf` and runs `pnpm tf apply`,
Then the record appears in Cloudflare within 60 seconds with no manual dashboard interaction.

#### Scenario: Deleted record removed via HCL

Given a `cloudflare_dns_record` resource is removed from HCL,
When `pnpm tf plan` is run,
Then the plan shows exactly one record scheduled for deletion with no other side effects.

### Requirement: Cloudflare API token sourced from .secrets.env

The `cloudflare` provider must receive its token exclusively from the `TF_VAR_cloudflare_api_token`
environment variable (sourced by `tf.sh` from `infra/.secrets.env`). The token must never be
hardcoded in any `.tf` file.

#### Scenario: Missing .secrets.env triggers bootstrap

Given `infra/.secrets.env` does not exist,
When `pnpm tf init` is run,
Then `tf.sh` creates the file with a placeholder token, sets `chmod 600`, and exits with a message
instructing the user to fill in the token before retrying.

#### Scenario: Empty token triggers early exit

Given `infra/.secrets.env` exists but `TF_VAR_cloudflare_api_token` is empty,
When any `pnpm tf *` command is run,
Then `tf.sh` prints a warning and exits non-zero before invoking `terraform`.

## ADDED Requirements

### Requirement: tf.sh wires Terraform Cloud backend auth

`tf.sh` MUST change directory into `infra/environments/prod/` before delegating to `terraform`,
ensuring the correct backend and providers are always selected.

#### Scenario: pnpm tf plan from repo root

Given the developer is at any directory inside the repo,
When they run `pnpm tf plan`,
Then `tf.sh` resolves the `prod/` environment directory relative to the script's own location and
executes `terraform plan -out=prod.tfplan` inside it.

#### Scenario: pnpm tf apply writes .tf-outputs.env

Given a successful `terraform apply`,
When `tf.sh apply` completes,
Then `infra/.tf-outputs.env` is written with all outputs prefixed `TF_OUT_` and set `chmod 600`.
