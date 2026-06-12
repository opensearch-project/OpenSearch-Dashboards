#!/usr/bin/env bash
#
# SPDX-License-Identifier: Apache-2.0
#
# Phase 8, Story 2 — PORTABLE, CREDENTIAL-FREE DUAL-PATH CI GATE.
#
# Single entrypoint that proves the dual-path invariant on every change WITHOUT
# any cloud credentials:
#
#   PATH A  old way :5601 (no --mfe) is byte-for-byte unchanged
#             - verify_baseline.js     (8/8 core pages render)
#             - verify_noflag_diff.js  (served HTML byte-identical to reference)
#   PATH B  --mfe :5602 loads its UI from Module Federation remotes served by the
#           LOCAL origin :8080 (NOT the CDN)
#             - build the 58 MFE remotes locally   (scripts/build_mfe --all)
#             - point the registry at the local origin (scripts/update_registry --base-url)
#             - (re)launch the --mfe instance on :5602 from that local origin
#             - verify_mfe_render.js     (core pages boot; remoteEntry.js from :8080)
#             - verify_mfe_coverage.js   (coverage smoke: all core pages + every
#                                         declared remote reachable from the origin)
#
# This is the credential-free SUBSET of harness/verify_e2e.js (paths A + B-local +
# coverage). It deliberately OMITS the cloud paths from the full matrix — the
# CDN/CloudFront render check, the deploy step, and the override-against-CloudFront
# check all require Isengard credentials and therefore stay a separate MANUAL job
# (NOT part of the PR gate). This script makes ZERO credentialed cloud calls: it
# never refreshes Isengard creds, never runs the deploy/CDN verifiers, and never
# repoints the registry at the CDN manifest.
#
# Exit code: a SINGLE aggregate code — 0 only if every gate above passed; non-zero
# if any step failed (fails closed). A printed summary lists each step's result.
#
# Setup/teardown:
#   - The registry DATA file is mutated (pointed at the local origin) during PATH B.
#     The exact pre-run bytes are saved up front and ALWAYS restored on exit (even
#     on failure/interrupt) via an EXIT trap, so the gate never leaves the registry
#     in a switched state.
#   - The --mfe (:5602) and origin (:8080) processes this gate (re)starts are stopped
#     on exit (clean for ephemeral CI runners). Set KEEP_SERVERS=1 to leave them up.
#   - The old-way :5601 instance and OpenSearch :9200 are NEVER touched. They must
#     already be running (locally they are; in CI the workflow provisions them).
#
# Path portability: the script derives the OSD repo root and the workspace root
# from its OWN location (scripts/ci -> scripts -> repo root; workspace root is the
# repo's parent in the standard layout). Explicit $WORKSPACE_DIR / $HARNESS_DIR /
# $OSD_DIR overrides take precedence, so it runs from any checkout / CI runner and
# from any current working directory.
#
# Usage:
#   bash scripts/ci/mfe_dual_path.sh
#   KEEP_SERVERS=1 bash scripts/ci/mfe_dual_path.sh   # leave :5602 + :8080 running
#   WORKSPACE_DIR=/path/to/ws bash <abs>/scripts/ci/mfe_dual_path.sh   # explicit root
#
set -uo pipefail

# ---------------------------------------------------------------------------
# 0. Resolve paths from THIS script's location (with env-var overrides first).
#    scripts/ci/mfe_dual_path.sh  ->  scripts/ci -> scripts -> <repo root>.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
OSD_DIR_DERIVED="$(cd "$SCRIPT_DIR/../.." && pwd)"
export OSD_DIR="${OSD_DIR:-$OSD_DIR_DERIVED}"
# Standard layout: the harness + registry live in the OSD repo's PARENT (workspace
# root). Allow explicit overrides so CI can place them elsewhere.
export WORKSPACE_DIR="${WORKSPACE_DIR:-$(cd "$OSD_DIR/.." && pwd)}"
HARNESS_DIR="${HARNESS_DIR:-$WORKSPACE_DIR/harness}"

log()  { printf '[mfe_dual_path] %s\n' "$*"; }
hr()   { printf '\n%s\n=== %s\n%s\n' "$(printf '=%.0s' {1..78})" "$1" "$(printf '=%.0s' {1..78})"; }
fatal() { log "FATAL: $*"; exit 2; }

[ -f "$HARNESS_DIR/env.sh" ] || fatal "harness env.sh not found at $HARNESS_DIR/env.sh (set HARNESS_DIR or WORKSPACE_DIR)"

# Source the shared harness env (exports OSD_DIR, REGISTRY_BASE_URL, MFE_REGISTRY_PATH,
# MFE_OSD_PORT/URL, OSD_URL, OPENSEARCH_URL, NODE_PATH, ...). Sourcing only sets
# variables/functions — it performs no network or credential operations.
# shellcheck source=/dev/null
source "$HARNESS_DIR/env.sh"

# Credential-free / no-CDN hardening: env.sh sources harness/cdn_outputs.env, which
# sets the CloudFront location vars. This gate loads remotes ONLY from the local
# origin, so clear them here as a best effort so the node verifiers in THIS shell
# never consult a CDN location. NOTE: run_osd_mfe.sh re-sources env.sh, so the
# launched --mfe server may still add the CDN origin to its CSP allow-list from
# cdn_outputs.env — that is a no-op allow-list entry, NOT a CDN interaction. This
# gate fetches ZERO bytes from the CDN: the registry is repointed so every remote
# is served by the local origin :8080 (verify_mfe_render asserts this).
unset CDN_BASE_URL CDN_DOMAIN CDN_DISTRIBUTION_ID CDN_BUCKET CDN_KEY_PREFIX 2>/dev/null || true

ORIGIN_URL="${REGISTRY_BASE_URL:-http://localhost:8080}"
ORIGIN_PORT="$(printf '%s' "$ORIGIN_URL" | sed -E 's#.*:([0-9]+).*#\1#')"
MFE_PORT="${MFE_OSD_PORT:-5602}"
OLD_WAY_URL="${OSD_URL:-http://localhost:5601}"
REGISTRY_FILE="${MFE_REGISTRY_PATH:-$WORKSPACE_DIR/registry/registry.json}"

log "workspace : $WORKSPACE_DIR"
log "osd repo  : $OSD_DIR"
log "harness   : $HARNESS_DIR"
log "registry  : $REGISTRY_FILE"
log "old-way   : $OLD_WAY_URL   --mfe: ${MFE_OSD_URL:-http://localhost:$MFE_PORT}   origin: $ORIGIN_URL"
log "creds     : NONE (credential-free gate; CDN/deploy paths are a separate manual job)"

# ---------------------------------------------------------------------------
# 1. Preconditions (fail closed). We do NOT start :5601 / :9200 — the old-way
#    instance and OpenSearch are external dependencies (local dev / CI workflow).
# ---------------------------------------------------------------------------
[ -d "$OSD_DIR" ]        || fatal "OSD repo not found at $OSD_DIR"
[ -f "$REGISTRY_FILE" ]  || fatal "registry data file not found at $REGISTRY_FILE"

http_code() { curl -s -m5 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo 000; }

OLD_WAY_STATUS="$(http_code "$OLD_WAY_URL/api/status")"
if [ "$OLD_WAY_STATUS" != "200" ] && [ "$OLD_WAY_STATUS" != "401" ]; then
  fatal "old-way OSD :5601 not ready ($OLD_WAY_URL/api/status -> HTTP $OLD_WAY_STATUS). Start it (and OpenSearch :9200) before running this gate."
fi
log "precheck: old-way OSD reachable ($OLD_WAY_URL/api/status -> $OLD_WAY_STATUS)"

# ---------------------------------------------------------------------------
# 2. Save the pristine registry bytes and register the restore/teardown trap.
# ---------------------------------------------------------------------------
REG_BACKUP="$(mktemp "${TMPDIR:-/tmp}/mfe_registry_backup.XXXXXX.json")"
cp "$REGISTRY_FILE" "$REG_BACKUP" || fatal "could not back up registry $REGISTRY_FILE"
log "registry backup -> $REG_BACKUP"

cleanup() {
  local final=$?
  hr "TEARDOWN"
  # ALWAYS restore the exact pre-run registry bytes (never leave it switched).
  if [ -f "$REG_BACKUP" ]; then
    if cp "$REG_BACKUP" "$REGISTRY_FILE" 2>/dev/null; then
      log "registry restored from pre-run backup"
    else
      log "WARN: failed to restore registry from $REG_BACKUP"
    fi
    rm -f "$REG_BACKUP"
  fi
  # Stop the --mfe (:$MFE_PORT) + origin (:$ORIGIN_PORT) this gate (re)started, unless asked to keep.
  # The old-way :5601 is deliberately left running by reset_env.sh.
  if [ "${KEEP_SERVERS:-0}" != "1" ]; then
    bash "$HARNESS_DIR/reset_env.sh" reset >/dev/null 2>&1 || true
    log "stopped --mfe :$MFE_PORT + origin :$ORIGIN_PORT (KEEP_SERVERS=1 to keep)"
  else
    log "KEEP_SERVERS=1 -> leaving --mfe :$MFE_PORT + origin :$ORIGIN_PORT running"
  fi
  log "exit code: $final"
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# 3. Step runner: run a labelled command, record PASS/FAIL, never abort the run.
# ---------------------------------------------------------------------------
FAILED=0
declare -a SUMMARY=()

step() {
  local label="$1"; shift
  hr "$label"
  log "\$ $*"
  "$@"
  local code=$?
  if [ "$code" -ne 0 ]; then
    FAILED=1
    SUMMARY+=("FAIL  $label  (exit $code)")
    log "STEP FAILED: $label (exit $code)"
  else
    SUMMARY+=("PASS  $label")
  fi
  return $code
}

skip() {
  local label="$1"; local reason="$2"
  FAILED=1
  SUMMARY+=("SKIP  $label  (not run: $reason)")
  log "SKIPPED: $label — $reason"
}

# ---------------------------------------------------------------------------
# 4. PATH A — old way :5601 (independent of the MFE build).
# ---------------------------------------------------------------------------
step "PATH A (1/2): verify_baseline.js — old-way :5601, 8 core pages" \
  node "$HARNESS_DIR/verify_baseline.js"
step "PATH A (2/2): verify_noflag_diff.js — no-flag HTML byte-identical" \
  node "$HARNESS_DIR/verify_noflag_diff.js"

# ---------------------------------------------------------------------------
# 5. PATH B — --mfe :5602 from the LOCAL origin :8080 (build -> repoint -> launch
#    -> verify). The build/repoint/launch are a chain: if one fails the --mfe
#    verifiers cannot run meaningfully, so they are recorded as skipped (which
#    still fails the gate).
# ---------------------------------------------------------------------------
if step "PATH B (build): scripts/build_mfe --all — build 58 MFE remotes locally" \
      bash -c "cd \"$OSD_DIR\" && node scripts/build_mfe --all"; then
  if step "PATH B (registry): scripts/update_registry --base-url $ORIGIN_URL — point remotes at LOCAL origin" \
        bash -c "cd \"$OSD_DIR\" && MFE_REGISTRY_PATH=\"$REGISTRY_FILE\" node scripts/update_registry --base-url \"$ORIGIN_URL\""; then
    if step "PATH B (launch): run_osd_mfe.sh — start origin :$ORIGIN_PORT + --mfe :$MFE_PORT from local origin" \
          env FORCE_RESTART=1 bash "$HARNESS_DIR/run_osd_mfe.sh"; then
      step "PATH B (1/2): verify_mfe_render.js — --mfe boots; remoteEntry.js from :$ORIGIN_PORT" \
        node "$HARNESS_DIR/verify_mfe_render.js"
      step "PATH B (2/2): verify_mfe_coverage.js — coverage smoke (all core pages + every remote reachable)" \
        env REGISTRY_PATH="$REGISTRY_FILE" node "$HARNESS_DIR/verify_mfe_coverage.js"
    else
      skip "PATH B (1/2): verify_mfe_render.js"   "--mfe instance did not launch"
      skip "PATH B (2/2): verify_mfe_coverage.js" "--mfe instance did not launch"
    fi
  else
    skip "PATH B (launch + render + coverage)" "registry repoint to local origin failed"
  fi
else
  skip "PATH B (registry + launch + render + coverage)" "MFE remote build failed"
fi

# ---------------------------------------------------------------------------
# 6. Aggregate summary + single exit code.
# ---------------------------------------------------------------------------
hr "DUAL-PATH GATE SUMMARY (credential-free)"
for line in "${SUMMARY[@]}"; do
  printf '%s\n' "$line"
done
printf '\n'
if [ "$FAILED" -eq 0 ]; then
  log "MFE_DUAL_PATH OK — old way unchanged AND --mfe loads from the LOCAL origin"
else
  log "MFE_DUAL_PATH FAILED — see per-step results above"
fi

exit "$FAILED"
