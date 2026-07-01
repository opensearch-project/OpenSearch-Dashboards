# SPDX-License-Identifier: Apache-2.0
#
# packages/osd-mfe/dev/env.example.sh — environment variable template for the
# local MFE dev harness. Copy/adapt this to set the inputs the dev scripts read.
#
# Usage:
#   cp packages/osd-mfe/dev/env.example.sh packages/osd-mfe/dev/env.local.sh
#   # edit env.local.sh
#   source packages/osd-mfe/dev/env.local.sh
#   bash packages/osd-mfe/dev/run_osd_mfe.sh
#
# All variables are OPTIONAL with sensible defaults; set the ones you need.

# ---------------------------------------------------------------------------
# CORE: where the local origin lives + which OSD port to launch
# ---------------------------------------------------------------------------

# The local origin (a Node HTTP server) that serves the registry JSON, the
# bootstrap bundle, and the shared-deps entry. The harness launches this from
# `dev/local_registry_server.js`. Default :8080.
# export ORIGIN_PORT=8080

# The OSD --mfe port that boots against the local origin. Default :5602.
# (Old-way OSD typically runs on :5601 alongside; that's left untouched.)
# export MFE_PORT=5602

# ---------------------------------------------------------------------------
# OPTIONAL: external CDN base URL
# ---------------------------------------------------------------------------

# If set, the harness configures `opensearchDashboards.mfe.cdnOrigin` so the
# served CSP allow-lists this origin. Use this when plugin remoteEntry.js files
# live on an external CDN (CloudFront, S3 static host, etc.) instead of the
# local :8080 origin. Empty => local origin only.
#
# Example:
#   export CDN_BASE_URL=https://my-cdn.example.com
# export CDN_BASE_URL=

# ---------------------------------------------------------------------------
# OPTIONAL: additional dev-only CSP allow-list origins
# ---------------------------------------------------------------------------

# Comma-separated extra origins to add to the CSP script-src/worker-src/style-src
# allow-list, ONLY when `opensearchDashboards.mfe.allowOverride` is true (the
# default in --dev). Useful when:
#   1. You're loading a plugin remoteEntry from a SECONDARY CDN (in addition
#      to the primary one set via CDN_BASE_URL), e.g. testing a Lotus-backed
#      plugin alongside the existing CloudFront-backed plugins.
#   2. You're URL-overriding an MFE to a local dev server on a different port.
#
# Example:
#   export MFE_DEV_OVERRIDE_ORIGINS='https://second.example.com,http://localhost:9001'
# export MFE_DEV_OVERRIDE_ORIGINS=

# ---------------------------------------------------------------------------
# OPTIONAL: registry path override
# ---------------------------------------------------------------------------

# Path to the registry.json the local origin serves. Defaults to
# `packages/osd-mfe/dev/fixtures/registry.example.json`. For real local dev,
# point this at the registry your build process writes (e.g. one your
# `npm run build:mfe` step generates).
#
# Example:
#   export MFE_REGISTRY_PATH=/path/to/my/registry.json
# export MFE_REGISTRY_PATH=

# ---------------------------------------------------------------------------
# OPTIONAL: compat policy override
# ---------------------------------------------------------------------------

# Override the dev-default "block on incompatible / warn on missing" compat
# policy to mirror PROD behavior (skip-incompatible, skip-missing) for testing.
# Leave UNSET to use the dev default.
#
# export MFE_COMPAT_ON_INCOMPATIBLE=skip      # block | skip
# export MFE_COMPAT_ON_MISSING=skip           # warn-load | skip

# ---------------------------------------------------------------------------
# OPTIONAL: dev URL override gate
# ---------------------------------------------------------------------------

# Default in --dev: true (developers can use ?mfe.<id>=<url> URL params to
# repoint an MFE at a local dev server). Set to false to simulate PROD.
#
# export MFE_ALLOW_OVERRIDE=false

# ---------------------------------------------------------------------------
# OPTIONAL: registry signing
# ---------------------------------------------------------------------------

# Public key (PEM file path) used to verify the registry signature when the
# registry includes a `signature` field. Without this, signatures are ignored.
#
# export MFE_REGISTRY_SIGNING_KEY=/path/to/public-key.pem
# export MFE_REGISTRY_SIG_KEY_ID=my-key-2026

# ---------------------------------------------------------------------------
# OPTIONAL: tenant routing (server-side per-tenant resolution)
# ---------------------------------------------------------------------------

# The customer / tenant identifier used for per-tenant resolution.
# Default: "default".
#
# export MFE_CUSTOMER_ID=tenant-acme

# The cookie name carrying the sticky user-bucket value (0-99) that drives
# percentile-based canary routing. Default: "_osd_mfe_bucket".
#
# export MFE_USER_BUCKET_COOKIE_NAME=_my_bucket_cookie

# ---------------------------------------------------------------------------
# OPTIONAL: telemetry
# ---------------------------------------------------------------------------

# URL the bootstrap POSTs telemetry events to via Beacon API. Default: unset
# (telemetry disabled).
#
# export MFE_TELEMETRY_ENDPOINT=http://localhost:8081/mfe/telemetry
