#!/usr/bin/env bash
#
# SPDX-License-Identifier: Apache-2.0
#
# Launch the integrated MFE environment for Phase 3 (Story 5): a SECOND OpenSearch
# Dashboards instance booted with `--mfe` on :5602 (MFE_OSD_PORT), whose UI is
# loaded from Module Federation remotes served by the origin (:8080), while the
# old-way instance on :5601 keeps running untouched as the regression reference.
#
# Topology (docs/01-MFE-DESIGN.md §6):
#   :5601  OSD old-way (already running)            — regression reference, NOT touched here
#   :5602  OSD --mfe (this script)                  — boots UI from MF remotes
#   :8080  origin (local_registry_server.js)         — /registry + /mfe + /shared-deps + /bootstrap (CORS)
#
# What this does, in order:
#   1. Build the browser MFE bootstrap bundle (idempotent).
#   2. Ensure the origin (:8080) is running and serving the NEW /bootstrap/ route
#      (restart it if missing — it is a stateless mock).
#   3. Launch OSD --mfe on :5602 with --no-optimizer --no-watch (reusing the
#      on-disk bundles the running :5601 optimizer already built), injecting the
#      mfe registry/shared-deps/bootstrap URLs via config overrides.
#   4. Wait for "http server running" on :5602, then leave it running in the
#      background. The verifier (harness/verify_mfe_render.js) drives it.
#
# Usage:
#   source harness/env.sh            # (this script also sources it)
#   bash harness/run_osd_mfe.sh      # backgrounds OSD :5602; returns when ready
#   FORCE_RESTART=1 bash harness/run_osd_mfe.sh   # kill+relaunch even if already up
#
# Env (from env.sh): OSD_DIR, HARNESS_DIR, MFE_OSD_PORT (5602), MFE_OSD_URL,
#   REGISTRY_BASE_URL (http://localhost:8080).
#
set -uo pipefail

# Resolve the harness dir robustly regardless of CWD, then source the shared env.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/env.sh"
HARNESS_DIR="$SCRIPT_DIR"

ORIGIN_URL="${REGISTRY_BASE_URL:-http://localhost:8080}"
ORIGIN_PORT="$(printf '%s' "$ORIGIN_URL" | sed -E 's#.*:([0-9]+).*#\1#')"
PORT="${MFE_OSD_PORT:-5602}"
OSD_MFE_URL="${MFE_OSD_URL:-http://localhost:$PORT}"

# The mfe config URLs the served shell injects (docs §6). All from the origin.
REGISTRY_URL="$ORIGIN_URL/registry"
SHARED_DEPS_URL="$ORIGIN_URL/shared-deps/osd-ui-shared-deps.js"
BOOTSTRAP_URL="$ORIGIN_URL/bootstrap/osd_bootstrap_mfe.js"

LOG_FILE="${OSD_MFE_LOG:-/tmp/osd_mfe_${PORT}.log}"
PID_FILE="${OSD_MFE_PID:-/tmp/osd_mfe_${PORT}.pid}"
ORIGIN_LOG="${ORIGIN_LOG:-/tmp/registry_server_${ORIGIN_PORT}.log}"

log() { printf '[run-osd-mfe] %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. Build the browser MFE bootstrap bundle (idempotent; ~1s).
# ---------------------------------------------------------------------------
log "Building MFE bootstrap bundle ..."
if ! node "$SCRIPT_DIR/build_bootstrap.js"; then
  log "FATAL: bootstrap bundle build failed"
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Ensure the origin (:8080) is up and serving the /bootstrap route.
#    Restart it if the route is missing (older instance) — it is a stateless mock.
# ---------------------------------------------------------------------------
bootstrap_http() {
  curl -s -o /dev/null -w '%{http_code}' "$BOOTSTRAP_URL" 2>/dev/null || echo "000"
}

origin_ok() {
  [ "$(bootstrap_http)" = "200" ]
}

if origin_ok; then
  log "Origin already serving /bootstrap (200) at $ORIGIN_URL"
else
  log "Origin missing/stale /bootstrap route — (re)starting local_registry_server.js on :$ORIGIN_PORT"
  pkill -f "local_registry_server.js" 2>/dev/null || true
  sleep 1
  ( node "$SCRIPT_DIR/local_registry_server.js" "$ORIGIN_PORT" >"$ORIGIN_LOG" 2>&1 & )
  for _ in $(seq 1 30); do
    if origin_ok; then break; fi
    sleep 0.5
  done
  if ! origin_ok; then
    log "FATAL: origin did not come up serving /bootstrap (see $ORIGIN_LOG)"
    tail -n 20 "$ORIGIN_LOG" 2>/dev/null || true
    exit 1
  fi
  log "Origin up: /bootstrap, /registry, /shared-deps, /mfe (CORS) at $ORIGIN_URL"
fi

# Sanity: registry + shared-deps must also be reachable (the bootstrap needs them).
for path in "/registry" "/shared-deps/osd-ui-shared-deps.js"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$ORIGIN_URL$path" 2>/dev/null || echo 000)"
  if [ "$code" != "200" ]; then
    log "FATAL: origin $ORIGIN_URL$path returned HTTP $code (expected 200)"
    exit 1
  fi
done
log "Origin endpoints OK: /registry, /shared-deps, /bootstrap"

# ---------------------------------------------------------------------------
# 3. Launch OSD --mfe on :5602 (unless already serving and FORCE_RESTART unset).
# ---------------------------------------------------------------------------
osd_status() {
  curl -s -o /dev/null -w '%{http_code}' "$OSD_MFE_URL/api/status" 2>/dev/null || echo "000"
}

already_up() {
  local code
  code="$(osd_status)"
  [ "$code" = "200" ] || [ "$code" = "401" ]
}

if [ "${FORCE_RESTART:-0}" != "1" ] && already_up; then
  log "OSD --mfe already serving on :$PORT ($OSD_MFE_URL) — reusing (FORCE_RESTART=1 to relaunch)"
  exit 0
fi

# Clean any prior instance we launched.
if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "${OLD_PID:-}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    log "Stopping previous OSD --mfe (pid $OLD_PID)"
    kill "$OLD_PID" 2>/dev/null || true
    sleep 2
  fi
  rm -f "$PID_FILE"
fi

cd "$OSD_DIR" || { log "FATAL: cannot cd $OSD_DIR"; exit 1; }

# Cross-origin scripts (bootstrap, shared-deps, plugin remoteEntry.js + chunks)
# load from origins other than 'self', which OSD's default CSP
# (`script-src 'unsafe-eval' 'self'`) would BLOCK. MFE mode is inherently
# cross-origin (core + shell from :5602; remotes/shared-deps/bootstrap from the
# origin and/or CDN).
#
# Phase 5 (story 4): the CSP allow-list now lives in SHIPPED server config, NOT in
# this harness. When `opensearchDashboards.mfe.enabled` is on, the server derives
# the bootstrap/shared-deps script origins from their configured URLs and adds the
# CDN origin from `opensearchDashboards.mfe.cdnOrigin`, widening script-src/worker-src
# itself (see src/legacy/ui/ui_render/{utils.js:buildMfeCspRules,ui_render_mixin.js}).
# So we only point the config at the CDN origin here — no more temp-yaml csp.rules.
#
# Phase 4 (CDN): the dynamic registry can be repointed so plugin remoteEntry.js +
# chunks load from the pre-provisioned CloudFront distribution (CDN_BASE_URL, from
# harness/cdn_outputs.env via env.sh). The local origin (:8080) still serves the
# registry DATA, the MFE bootstrap bundle, and the shared-deps entry; the server
# allow-lists that origin automatically from bootstrapUrl/sharedDepsUrl. cdnOrigin
# is set only when a CDN is configured (empty otherwise — no CSP widening for it).
CDN_ORIGIN="${CDN_BASE_URL:-}"
if [ -n "$CDN_ORIGIN" ]; then
  log "mfe.cdnOrigin set => server will allow CDN origin in CSP: $CDN_ORIGIN"
fi

# Phase 5 (story 5): the dev URL-override security gate. By default this is left
# UNSET so the server resolves it from dev mode (the canonical resolveAllowOverride:
# explicit boolean wins, else dev => true / prod => false). Launched with --dev,
# an unset value means allowOverride=true (overrides honored). To exercise the
# PROD gate WITHOUT dropping --dev (which would change which on-disk bundles are
# served), set MFE_ALLOW_OVERRIDE=false: the explicit boolean wins, so the served
# shell injects __osdMfe__.allowOverride=false and the bootstrap IGNORES every
# override source — exactly production behavior. Used by harness/verify_mfe_override.js
# to launch a second "prod-gate" instance (e.g. :5603 MFE_ALLOW_OVERRIDE=false).
ALLOW_OVERRIDE_LINE=""
if [ -n "${MFE_ALLOW_OVERRIDE:-}" ]; then
  ALLOW_OVERRIDE_LINE="opensearchDashboards.mfe.allowOverride: ${MFE_ALLOW_OVERRIDE}"
  log "mfe.allowOverride explicitly set => $MFE_ALLOW_OVERRIDE"
fi

# Lotus PoC additive: when MFE_DEV_OVERRIDE_ORIGINS is set (comma-separated
# https://… origins), emit `opensearchDashboards.mfe.devOverrideOrigins` so the
# served CSP allow-lists them in script-src/worker-src/style-src/etc. Honored
# only when allowOverride=true (dev default in --dev). Use case: serve a
# remoteEntry.js from an external CDN (e.g. TangerineBox) without changing the
# primary cdnOrigin (which other plugins still load from).
DEV_OVERRIDE_LINE=""
if [ -n "${MFE_DEV_OVERRIDE_ORIGINS:-}" ]; then
  # Convert comma-separated list to a JSON/YAML array of quoted strings.
  DEV_OVERRIDE_YAML='['
  first=1
  IFS=',' read -ra _origins <<< "${MFE_DEV_OVERRIDE_ORIGINS}"
  for o in "${_origins[@]}"; do
    o_trimmed=$(echo "$o" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "$o_trimmed" ] && continue
    if [ $first -eq 1 ]; then first=0; else DEV_OVERRIDE_YAML+=", "; fi
    DEV_OVERRIDE_YAML+="\"$o_trimmed\""
  done
  DEV_OVERRIDE_YAML+=']'
  DEV_OVERRIDE_LINE="opensearchDashboards.mfe.devOverrideOrigins: $DEV_OVERRIDE_YAML"
  log "mfe.devOverrideOrigins set => $DEV_OVERRIDE_YAML"
fi

# Phase 13: the OSD server resolves the registry SERVER-SIDE when
# `opensearchDashboards.mfe.registryPath` points at the on-disk
# `schemaVersion: 1` registry document. With this set, the rendered HTML
# carries the projected `BootManifest` inline (under `__osdMfe__`) and the
# browser bootstrap consumes it DIRECTLY — no `/registry` HTTP fetch from the
# browser (the Phase 13 invariant the dual-path gate's verify_mfe_render
# locks). When the env var is unset, the line is OMITTED entirely so OSD
# falls back to the legacy browser-fetch path (registryUrl) — same posture
# as a plain CI checkout without a workspace registry.
MFE_REGISTRY_PATH_LINE=""
if [ -n "${MFE_REGISTRY_PATH:-}" ] && [ -f "${MFE_REGISTRY_PATH}" ]; then
  MFE_REGISTRY_PATH_LINE="opensearchDashboards.mfe.registryPath: \"${MFE_REGISTRY_PATH}\""
  log "mfe.registryPath => ${MFE_REGISTRY_PATH}"
fi

MFE_CONFIG="${OSD_MFE_CONFIG:-/tmp/osd_mfe_${PORT}.yml}"
cat >"$MFE_CONFIG" <<YAML
# Auto-generated by run_osd_mfe.sh (Phase 3, Story 5; Phase 5, Story 4). Do not edit by hand.
server.port: $PORT

# Phase 3 MFE mode (docs/01-MFE-DESIGN.md §6).
opensearchDashboards.mfe.enabled: true
opensearchDashboards.mfe.registryUrl: "$REGISTRY_URL"
opensearchDashboards.mfe.sharedDepsUrl: "$SHARED_DEPS_URL"
opensearchDashboards.mfe.bootstrapUrl: "$BOOTSTRAP_URL"

# Phase 5 (story 4): the CDN origin serving plugin remoteEntry.js + chunks. The
# SHIPPED server config (not this harness) widens the served CSP script-src/worker-src
# with this origin plus the bootstrap/shared-deps origins (derived from their URLs).
# Empty => no CDN; the local origin (:8080) is still allow-listed via bootstrapUrl.
opensearchDashboards.mfe.cdnOrigin: "$CDN_ORIGIN"
${ALLOW_OVERRIDE_LINE}
${DEV_OVERRIDE_LINE}
${MFE_REGISTRY_PATH_LINE}
YAML
log "Wrote MFE config: $MFE_CONFIG"

log "Launching OSD --mfe on :$PORT (log: $LOG_FILE) ..."
log "  registryUrl   = $REGISTRY_URL"
log "  sharedDepsUrl = $SHARED_DEPS_URL"
log "  bootstrapUrl  = $BOOTSTRAP_URL"

# --dev            : development defaults (matches :5601), so the same on-disk
#                    dev bundles are served.
# -c <file>        : the generated MFE config (mfe URLs + mfe.cdnOrigin; the shipped
#                    server code widens the CSP from these — no temp-yaml csp.rules).
# --no-base-path   : no base-path proxy (so :5602 is the real server port).
# --no-optimizer   : do NOT start a second optimizer — reuse the bundles the
#                    running :5601 optimizer already wrote to target/public.
# --no-watch       : no file-watch restarts.
# --mfe            : toggle opensearchDashboards.mfe.enabled=true (also set in -c).
nohup node scripts/opensearch_dashboards \
  --dev \
  -c "$MFE_CONFIG" \
  --no-base-path \
  --no-optimizer \
  --no-watch \
  --mfe \
  -p "$PORT" \
  >"$LOG_FILE" 2>&1 &

OSD_PID=$!
echo "$OSD_PID" >"$PID_FILE"
log "OSD --mfe pid $OSD_PID (pidfile $PID_FILE)"

# ---------------------------------------------------------------------------
# 4. Wait for readiness. A cold first run (optimizer cache warm-up / migrations)
#    can take minutes; allow a generous timeout. Success = the http server log
#    line AND an HTTP status response.
# ---------------------------------------------------------------------------
READY_TIMEOUT="${READY_TIMEOUT:-600}"
log "Waiting up to ${READY_TIMEOUT}s for 'http server running' on :$PORT ..."
deadline=$(( $(date +%s) + READY_TIMEOUT ))
while [ "$(date +%s)" -lt "$deadline" ]; do
  if ! kill -0 "$OSD_PID" 2>/dev/null; then
    log "FATAL: OSD --mfe process exited early (see $LOG_FILE)"
    tail -n 40 "$LOG_FILE" 2>/dev/null || true
    exit 1
  fi
  if grep -aq "http server running at" "$LOG_FILE" 2>/dev/null; then
    # Server bound; give the status endpoint a moment to answer.
    for _ in $(seq 1 20); do
      if already_up; then
        log "OSD --mfe READY on $OSD_MFE_URL (pid $OSD_PID)"
        grep -aoE "http server running at [^ ]+" "$LOG_FILE" | tail -1
        exit 0
      fi
      sleep 1
    done
  fi
  sleep 2
done

log "FATAL: timed out after ${READY_TIMEOUT}s waiting for :$PORT (see $LOG_FILE)"
tail -n 40 "$LOG_FILE" 2>/dev/null || true
exit 1
