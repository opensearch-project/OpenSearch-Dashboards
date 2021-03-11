#!/usr/bin/env bash

source src/dev/ci_setup/setup_env.sh
source "$OPENSEARCH_DASHBOARDS_DIR/src/dev/ci_setup/setup_percy.sh"

echo " -> building and extracting OSS OpenSearch Dashboards distributable for use in functional tests"
node scripts/build --debug --oss
linuxBuild="$(find "$OPENSEARCH_DASHBOARDS_DIR/target" -name 'opensearch-dashboards-*-linux-x86_64.tar.gz')"
installDir="$PARENT_DIR/install/opensearch-dashboards"
mkdir -p "$installDir"
tar -xzf "$linuxBuild" -C "$installDir" --strip=1
