#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

function setup_opensearch() {
  cd "$OPENSEARCH_DIR"
  echo "network.host: 0.0.0.0" >> config/opensearch.yml
  echo "discovery.type: single-node" >> config/opensearch.yml
  [ $SECURITY_ENABLED == "false" ] && [ -d "plugins/opensearch-security" ] && echo "plugins.security.disabled: true" >> config/opensearch.yml
  # Required for IM
  [ -d "plugins/opensearch-index-management" ] && echo "path.repo: [/tmp]" >> config/opensearch.yml
  # Required for Alerting
  [ -d "plugins/opensearch-alerting" ] && echo "plugins.destination.host.deny_list: [\"10.0.0.0/8\", \"127.0.0.1\"]" >> config/opensearch.yml
  # Required for SQL
  [ -d "plugins/opensearch-sql" ] && echo "script.context.field.max_compilations_rate: 1000/1m" >> config/opensearch.yml
  # Required for PA
  [ -d "plugins/opensearch-performance-analyzer" ] && echo "webservice-bind-host = 0.0.0.0" >> config/opensearch-performance-analyzer/performance-analyzer.properties
}

# Starts OpenSearch, if verifying a distribution it will install the certs then start.
function run_opensearch() {
  echo "[ Attempting to start OpenSearch... ]"
  cd "$OPENSEARCH_DIR"
  # Check if opensearch-tar-install.sh exists
  if [ -f "./opensearch-tar-install.sh" ]; then
    spawn_process_and_save_PID "./opensearch-tar-install.sh > ${LOGS_DIR}/opensearch.log 2>&1 &"
  else
    spawn_process_and_save_PID "./bin/opensearch > ${LOGS_DIR}/opensearch.log 2>&1 &"
  fi
}

# Checks the running status of OpenSearch
# it calls check_status and passes the OpenSearch tmp file path, error msg, url, and arguments
# if success, the while loop in the check_status will end and it prints out "OpenSearch is up!"
function check_opensearch_status() {
  echo "Checking the status OpenSearch..."
  cd "$DIR"
  check_status $OPENSEARCH_PATH "$OPENSEARCH_MSG" $OPENSEARCH_URL "$OPENSEARCH_ARGS" >> /dev/null 2>&1  &
  echo "OpenSearch is up!" 
} 
