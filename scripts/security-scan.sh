#!/usr/bin/env bash
# Local vulnerability/secret scan for Spendly. No CI required — run manually before deploys.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAILED=()

section() {
  echo
  echo "==> $1"
}

section "Gitleaks (secrets in git history + working tree)"
gitleaks detect --source . --no-banner --redact
[ $? -eq 0 ] || FAILED+=("gitleaks")

section "Trivy (dependency CVEs + Dockerfile/IaC misconfig)"
trivy fs . --scanners vuln,misconfig --exit-code 1 --severity HIGH,CRITICAL
[ $? -eq 0 ] || FAILED+=("trivy")

section "pip-audit (backend Python dependencies)"
backend/.venv/Scripts/pip-audit -r backend/requirements.txt
[ $? -eq 0 ] || FAILED+=("pip-audit")

section "npm audit (frontend JS dependencies)"
npm --prefix frontend audit --audit-level=high
[ $? -eq 0 ] || FAILED+=("npm audit")

echo
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "All scans passed clean."
  exit 0
else
  echo "Findings reported by: ${FAILED[*]}"
  echo "Review the output above before deploying."
  exit 1
fi
