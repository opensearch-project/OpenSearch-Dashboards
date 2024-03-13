#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

function setup_dashboards() {
  cd "$DASHBOARDS_DIR"
  [ $SECURITY_ENABLED == "false" ] && [ -d "plugins/securityDashboards" ] && ./bin/opensearch-dashboards-plugin remove securityDashboards
  [ $SECURITY_ENABLED == "false" ] && rm config/opensearch_dashboards.yml && touch config/opensearch_dashboards.yml
  [ $SECURITY_ENABLED == "false" ] && echo "server.host: 0.0.0.0" >> config/opensearch_dashboards.yml
  echo "csp.warnLegacyBrowsers: false" >> config/opensearch_dashboards.yml
  echo "--max-old-space-size=5120" >> config/node.options
}

# Starts OpenSearch Dashboards
function run_dashboards() {
  echo "[ Attempting to start OpenSearch Dashboards... ]"
  cd "$DASHBOARDS_DIR"
  spawn_process_and_save_PID "./bin/opensearch-dashboards > ${LOGS_DIR}/opensearch_dashboards.log 2>&1 &"
}

# Checks the running status of OpenSearch Dashboards
# it calls check_status and passes the OpenSearch Dashboards tmp file path, error msg, url, and arguments
# if success, the while loop in the check_status will end and it prints out "OpenSearch Dashboards is up!"
function check_dashboards_status {
  echo "Checking the OpenSearch Dashboards..."
  cd "$DIR"
  check_status $DASHBOARDS_PATH "$DASHBOARDS_MSG" $DASHBOARDS_URL "$OPENSEARCH_ARGS" >> /dev/null 2>&1
  echo "OpenSearch Dashboards is up!"
}
