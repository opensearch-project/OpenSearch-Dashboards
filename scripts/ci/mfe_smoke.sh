#!/usr/bin/env bash
#
# SPDX-License-Identifier: Apache-2.0
#
# Phase 8, Story 4 — MFE SMOKE runner (Cypress) against the `--mfe` instance.
#
# Runs a SMALL, representative Cypress smoke subset against the OSD instance
# booted with `--mfe` (default :5602), proving >= 2 core apps (discover +
# dashboards, plus the home shell) load END-TO-END through the Module Federation
# path. This is the lightweight functional companion to the credential-free
# dual-path gate (scripts/ci/mfe_dual_path.sh); it is NOT the full FTR/Cypress
# suite (too heavy for a PR gate).
#
# It is CREDENTIAL-FREE (no ada / AWS / CDN calls) and origin-agnostic: it only
# drives a browser against the already-running --mfe server. Bringing :5602 up
# (build remotes -> repoint registry at the LOCAL origin :8080 -> launch --mfe)
# is the job of the dual-path gate / harness, NOT this script — clean separation
# of concerns and composability.
#
# Browser: Cypress' BUNDLED Electron (headless), so no system Chrome is required.
#
# Path portability: derives the OSD repo root and workspace root from THIS
# script's own location (scripts/ci -> scripts -> repo root; workspace root is the
# repo's parent in the standard layout). Explicit $OSD_DIR / $WORKSPACE_DIR /
# $MFE_OSD_URL overrides take precedence, so it runs from any checkout / CI runner
# and from any current working directory.
#
# Usage:
#   # :5602 must already be up (local dev harness, or the dual-path gate run with
#   # KEEP_SERVERS=1). Then:
#   bash scripts/ci/mfe_smoke.sh
#
#   MFE_OSD_URL=http://localhost:5602 bash scripts/ci/mfe_smoke.sh   # explicit target
#   OSD_DIR=/path/to/OpenSearch-Dashboards bash <abs>/scripts/ci/mfe_smoke.sh
#
# Exit code: cypress' exit code (0 = all smoke specs passed; non-zero on any
# failure — fails closed).
#
set -uo pipefail

# ---------------------------------------------------------------------------
# 0. Resolve paths from THIS script's location (env-var overrides win).
#    scripts/ci/mfe_smoke.sh -> scripts/ci -> scripts -> <repo root>.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
OSD_DIR_DERIVED="$(cd "$SCRIPT_DIR/../.." && pwd)"
export OSD_DIR="${OSD_DIR:-$OSD_DIR_DERIVED}"
export WORKSPACE_DIR="${WORKSPACE_DIR:-$(cd "$OSD_DIR/.." && pwd)}"
# Resolve harness: IN-REPO copy first (packages/osd-mfe/dev/), then workspace parent.
if [ -z "${HARNESS_DIR:-}" ]; then
  if [ -f "$OSD_DIR/packages/osd-mfe/dev/env.sh" ]; then
    HARNESS_DIR="$OSD_DIR/packages/osd-mfe/dev"
  else
    HARNESS_DIR="$WORKSPACE_DIR/harness"
  fi
fi

log() { printf '[mfe_smoke] %s\n' "$*"; }
fatal() { log "FATAL: $*"; exit 2; }

# Source the shared harness env if present (for MFE_OSD_URL/MFE_OSD_PORT defaults
# and the active Node). Sourcing only sets variables — no network/credential ops.
# It is optional: explicit MFE_OSD_URL works without the harness (e.g. a bare CI
# runner that vendors the OSD repo only).
if [ -f "$HARNESS_DIR/env.sh" ]; then
  # shellcheck source=/dev/null
  source "$HARNESS_DIR/env.sh"
fi

MFE_OSD_URL="${MFE_OSD_URL:-http://localhost:${MFE_OSD_PORT:-5602}}"
SPEC="${MFE_SMOKE_SPEC:-cypress/integration/mfe/mfe_smoke.spec.js}"
CYPRESS_BIN="$OSD_DIR/node_modules/.bin/cypress"

log "osd repo : $OSD_DIR"
log "--mfe    : $MFE_OSD_URL"
log "spec     : $SPEC"
log "creds    : NONE (credential-free smoke; drives a browser only)"

# ---------------------------------------------------------------------------
# 1. Preconditions (fail closed with actionable guidance).
# ---------------------------------------------------------------------------
[ -d "$OSD_DIR" ]   || fatal "OSD repo not found at $OSD_DIR"
[ -f "$OSD_DIR/cypress.config.ts" ] || fatal "cypress.config.ts not found in $OSD_DIR (run from the OSD repo)"
[ -f "$OSD_DIR/$SPEC" ] || fatal "smoke spec not found: $OSD_DIR/$SPEC"
[ -x "$CYPRESS_BIN" ] || fatal "cypress binary not found at $CYPRESS_BIN (run 'yarn osd bootstrap' in the OSD repo)"

http_code() { curl -s -m5 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || true; }

MFE_STATUS="$(http_code "$MFE_OSD_URL/api/status")"
if [ "$MFE_STATUS" != "200" ] && [ "$MFE_STATUS" != "401" ]; then
  fatal "--mfe OSD not reachable ($MFE_OSD_URL/api/status -> HTTP $MFE_STATUS).
       Bring it up first, e.g.:
         bash harness/run_osd_mfe.sh                 # local dev (--mfe :5602)
         KEEP_SERVERS=1 bash scripts/ci/mfe_dual_path.sh  # CI topology (local origin)"
fi
log "precheck: --mfe OSD reachable ($MFE_OSD_URL/api/status -> $MFE_STATUS)"

# ---------------------------------------------------------------------------
# 2. Run the scoped Cypress smoke against :5602 with the BUNDLED Electron
#    (headless). Mirrors the repo's `cypress:run-without-security` env
#    (env -u DISPLAY, NO_COLOR) so it behaves the same headless on CI runners.
# ---------------------------------------------------------------------------
cd "$OSD_DIR" || fatal "cannot cd $OSD_DIR"

log "running cypress smoke against $MFE_OSD_URL (bundled Electron, headless) ..."
env -u DISPLAY NO_COLOR=1 TZ="${TZ:-America/Los_Angeles}" \
  "$CYPRESS_BIN" run \
  --browser electron \
  --headless \
  --spec "$SPEC" \
  --config "baseUrl=$MFE_OSD_URL,video=false" \
  --env SECURITY_ENABLED=false
code=$?

if [ "$code" -eq 0 ]; then
  log "MFE_SMOKE OK — core apps (home, discover, dashboards) loaded end-to-end via MFE on $MFE_OSD_URL"
else
  log "MFE_SMOKE FAILED — cypress exit $code (see output / cypress/screenshots above)"
fi
exit "$code"
