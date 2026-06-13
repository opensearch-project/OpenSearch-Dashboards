#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# reset_env.sh (VENDORED IN-REPO COPY) — resolves from repo layout.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/env.sh" >/dev/null 2>&1

REG="${MFE_REGISTRY_PATH}"
SNAP="${WORKSPACE_DIR}/.loop/registry.snapshot.json"
[ "$WORKSPACE_DIR" = "$OSD_DIR" ] && SNAP="$OSD_DIR/target/mfe-ci/registry.snapshot.json"
MFE_PORT="${MFE_OSD_PORT:-5602}"
ORIGIN_PORT="$(printf '%s' "${REGISTRY_BASE_URL:-http://localhost:8080}" | sed -E 's#.*:([0-9]+).*#\1#')"
mkdir -p "$(dirname "$SNAP")"

http() { curl -s -m3 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo 000; }
points() { [ -f "$1" ] && jq -r '.mfes.inspector.remoteEntry // "?"' "$1" 2>/dev/null || echo MISSING; }

case "${1:-status}" in
  status)
    echo "old-way :5601      = $(http http://localhost:5601/api/status)  (left alone)"
    echo "--mfe   :$MFE_PORT  = $(http http://localhost:$MFE_PORT/api/status)"
    echo "origin  :$ORIGIN_PORT  = $(http http://localhost:$ORIGIN_PORT/registry)"
    echo "registry.json -> $(points "$REG")"
    echo "--mfe pid = $( [ -f /tmp/osd_mfe_${MFE_PORT}.pid ] && cat /tmp/osd_mfe_${MFE_PORT}.pid || echo none )"
    ;;
  snapshot)
    if [ -f "$REG" ]; then cp "$REG" "$SNAP"; echo "snapshot -> $SNAP ($(points "$REG"))"; else echo "no registry to snapshot"; fi
    ;;
  restore)
    if [ -f "$SNAP" ]; then cp "$SNAP" "$REG"; echo "restored registry from snapshot ($(points "$REG"))"; else echo "no snapshot to restore"; fi
    ;;
  reset)
    if [ -f /tmp/osd_mfe_${MFE_PORT}.pid ]; then kill "$(cat /tmp/osd_mfe_${MFE_PORT}.pid)" 2>/dev/null || true; fi
    pkill -f "opensearch_dashboards .* -p ${MFE_PORT}" 2>/dev/null || true
    pkill -f "registry_server.js" 2>/dev/null || true
    rm -f /tmp/osd_mfe_${MFE_PORT}.pid
    echo "stopped --mfe :$MFE_PORT + origin :$ORIGIN_PORT (old-way :5601 left running)."
    ;;
  ensure)
    [ -f "$REG" ] || echo "WARN: registry $REG missing"
    echo "harness ready: --mfe :$MFE_PORT, origin :$ORIGIN_PORT, registry $REG"
    ;;
  *) echo "usage: reset_env.sh [status|ensure|snapshot|restore|reset]"; exit 2;;
esac
