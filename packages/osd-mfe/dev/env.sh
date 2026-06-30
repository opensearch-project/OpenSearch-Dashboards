# Shared environment for the OSD MFE harness (VENDORED IN-REPO COPY).
# SOURCE this (do not execute).
#   source scripts/ci/mfe-harness/env.sh
#
# This copy is identical in semantics to ../../../harness/env.sh but resolves
# paths relative to the OSD REPO (scripts/ci/mfe-harness -> scripts/ci -> scripts -> repo)
# so it works from a plain fork checkout without a workspace parent.
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
nvm use 22.22.0 >/dev/null 2>&1 || true

# Derive the OSD repo root from THIS script's location:
# mfe-harness/env.sh -> mfe-harness -> ci -> scripts -> <repo root>
_HARNESS_SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
export OSD_DIR="${OSD_DIR:-$(cd "$_HARNESS_SELF_DIR/../../.." && pwd)}"
export HARNESS_DIR="${HARNESS_DIR:-$_HARNESS_SELF_DIR}"

# WORKSPACE_DIR: use parent of repo if it has a workspace-level registry/ dir
# (local dev with the workspace layout); else repo itself for CI / plain forks.
if [ -d "$OSD_DIR/../registry" ]; then
  export WORKSPACE_DIR="${WORKSPACE_DIR:-$(cd "$OSD_DIR/.." && pwd)}"
else
  export WORKSPACE_DIR="${WORKSPACE_DIR:-$OSD_DIR}"
fi

# Playwright library lives in the parent dir's node_modules; NODE_PATH lets scripts anywhere require it.
_PARENT_MODULES="$(dirname "$WORKSPACE_DIR")/node_modules"
[ -d "$_PARENT_MODULES" ] && export NODE_PATH="$_PARENT_MODULES"

export OSD_URL="${OSD_URL:-http://localhost:5601}"
export OPENSEARCH_URL="${OPENSEARCH_URL:-http://localhost:9200}"

# Registry: in workspace layout use workspace/registry; in repo-only use target/mfe-ci
if [ -d "$WORKSPACE_DIR/registry" ] && [ "$WORKSPACE_DIR" != "$OSD_DIR" ]; then
  export MFE_REGISTRY_PATH="${MFE_REGISTRY_PATH:-$WORKSPACE_DIR/registry/registry.json}"
else
  mkdir -p "$OSD_DIR/target/mfe-ci"
  export MFE_REGISTRY_PATH="${MFE_REGISTRY_PATH:-$OSD_DIR/target/mfe-ci/registry.json}"
fi
export REGISTRY_BASE_URL="${REGISTRY_BASE_URL:-http://localhost:8080}"

# Phase 3 MFE-aware rendering: second OSD instance launched with --mfe
export MFE_OSD_PORT="${MFE_OSD_PORT:-5602}"
export MFE_OSD_URL="${MFE_OSD_URL:-http://localhost:5602}"

# CDN vars intentionally omitted — this is the credential-free harness.
# If cdn_outputs.env exists (workspace layout), skip it; gate clears these anyway.

# Sanity echo (quiet)
node --version >/dev/null 2>&1 || echo "WARN: node not active"
