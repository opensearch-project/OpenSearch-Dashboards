#!/usr/bin/env bash

source src/dev/ci_setup/setup_env.sh

echo " -> building OpenSearch Dashboards's platform plugins"
node scripts/build_opensearch_dashboards_platform_plugins \
  --oss \
  --scan-dir "$OPENSEARCH_DASHBOARDS_DIR/test/plugin_functional/plugins" \
  --scan-dir "$OPENSEARCH_DASHBOARDS_DIR/test/interpreter_functional/plugins" \
  --workers 6 \
  --verbose
