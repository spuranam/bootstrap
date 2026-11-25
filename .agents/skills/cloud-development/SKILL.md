---
name: cloud-development
description: Use for mise-workstation cloud/Kubernetes setup, gcloud/Python/ADC failures, and OpenShift or Tekton tools.
---

# Cloud development

## Ground rules

- Read [README](../../../README.md), [ADR-005/006](../../../DECISIONS.md),
  [credential lifecycle](../../../docs/CREDENTIALS.md) and [security](../../../docs/SECURITY.md).
- Keep Google Cloud identities local to the device; never commit ADC files, service account keys, access tokens or
  kubeconfig credentials.
- Distinguish **gcloud CLI login** (`gcloud auth login`) from **Application Default Credentials**
  (`gcloud auth application-default login`). Ask for approval before identity/account/project changes.
- mise owns Python; uv manages project environments. An override of a project's Python must not silently change the
  interpreter used by gcloud.
- This repository installs gcloud through mise. Do not use `gcloud components update` to upgrade it: component-manager
  updates modify the local installation in place and can make it drift from the mise lock. Follow
  [Maintenance and updates](../../../docs/MAINTENANCE.md#update-mise-managed-tool-versions) for reviewed gcloud lock
  updates; that workflow is for seed maintainers, while consumers use committed locks.

## Workflow

1. Identify OS and requested modules (`cloud`, optionally `kubernetes` or `supply-chain`). Check installed mise and
   gcloud versions/backends before proposing modifications.
2. Preview with `mise -E cloud bootstrap --dry-run` or another explicitly selected module set. Require approval before
   applying.
3. Prefer interactive identity login. For workloads, prefer least privilege and approved service-account impersonation
   rather than locally distributing long-lived JSON keys.
4. Confirm effective interpreter via `gcloud info --format='value(basic.python_location)'`. Workstation Python is
   pinned to mise 3.14.10; macOS `CLOUDSDK_PYTHON` points to that exact install before gcloud installation. On Linux,
   the override is unset; **do not** force it onto backend-provided Python.
5. Run `mise run cloud:python-check` and other cloud diagnostics when those tasks exist and the cloud module is active.
   Do not claim a mismatch is fixed merely by exporting `CLOUDSDK_PYTHON`.
6. For OpenShift/Kubernetes, verify CLI versions first. Never switch live cluster contexts, change deployments, or apply
   manifests without explicit approval.
7. For offboarding or compromise, distinguish `cloud:auth-revoke` from `cloud:adc-revoke`; require approval and never
   treat local file deletion alone as provider-side revocation.
8. Summarize tool status, auth/ADC distinction, interpreter observed, and any unsupported backend/platform limitations.
9. If the workflow changes repository Markdown or skills, run `mise run verify:skills` before reporting completion.

## Troubleshooting

If gcloud refuses the interpreter override or the backend requires another Python minor, inspect current Google Cloud
CLI support and the effective runtime, then update the workstation Python pin and macOS override together through
review. Do not modify Cloud SDK runtime files to work around the mismatch.
