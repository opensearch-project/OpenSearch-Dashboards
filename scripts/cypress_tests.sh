#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

. $OSD_PATH/scripts/common/utils.sh
. $OSD_PATH/scripts/common/opensearch_service.sh
. $OSD_PATH/scripts/common/opensearch_dashboards_service.sh

CWD=$(pwd)
CREDENTIAL="admin:myStrongPassword123!"

if [ $SECURITY_ENABLED == "false" ]; 
then 
  OPENSEARCH_MSG="\"status\":\"green\""
  OPENSEARCH_URL="http://localhost:9200/_cluster/health"
  OPENSEARCH_ARGS=""
else 
  OPENSEARCH_MSG="\"status\":\"yellow\""
  OPENSEARCH_URL="https://localhost:9200/_cluster/health"
  OPENSEARCH_ARGS="-u $CREDENTIAL --insecure"
fi
DASHBOARDS_URL="http://localhost:5601/api/status"

# Starts OpenSearch, if verifying a distribution it will install the certs then start.
function run_opensearch() {
  echo "[ Set up OpenSearch for cypress tests... ]"
  setup_opensearch >> /dev/null 2>&1  &
  sleep 100
  cd "$OPENSEARCH_DIR"
  # Check if opensearch-tar-install.sh exists
  if [ -f "./opensearch-tar-install.sh" ]; then
    spawn_process_and_save_PID "./opensearch-tar-install.sh &"
  else
    spawn_process_and_save_PID "./bin/opensearch &"
  fi
  check_status $OPENSEARCH_URL $OPENSEARCH_MSG
}

# Checks the running status of OpenSearch and Dashboards
# if success, the while loop in the check_status will end and it prints out successful message
function check_status() {
  STATUS_URL=$1
  STATUS_MSG=$2
  echo "Checking the status of URL: $STATUS_URL"
  # Calculate end time as 180s from now
  check_status_end_time=$(expr 180 + "$(date '+%s')")
  while true; do
    # Break if the current time exceeds the end time
    if [ $check_status_end_time -lt $(date '+%s') ]; then
      echo "Error: Status check has timed out"
      exit 1
    fi
    # Use curl to fetch data and check for the specified message
    if curl -s $STATUS_URL | grep -q "$STATUS_MSG"; then
      echo "Status check successful"
      break
    fi

    # Pause for a short interval before the next check
    sleep 1
  done
  echo "$STATUS_URL is up!" 
} 

# Starts OpenSearch Dashboards and run tests in the cypress folder
function run_dashboards_cypress_tests() {
  run_opensearch
  cd $CWD
  echo "[ OpenSearch Dashboards setup before it starts... ]"
  setup_dashboards >> /dev/null 2>&1 &
  sleep 100
  cd $CWD/"$DASHBOARDS_DIR"
  if [ -x "./bin/opensearch-dashboards" ]; then
    spawn_process_and_save_PID "./bin/opensearch-dashboards &"
  else
    echo "Error: opensearch-dashboards executable not found in $DASHBOARDS_DIR"
    exit 1
  fi
  check_status $DASHBOARDS_URL $DASHBOARDS_MSG
  # Run cypress tests
  cd "$CWD"/osd
  run_cypress
}

function run_cypress() {
  echo "SPEC found: $SPEC"
  if [ $SECURITY_ENABLED = "true" ]; then
    echo "run security enabled tests"
    yarn cypress:run-with-security --browser $CYPRESS_BROWSER --spec $SPEC
  else
    echo "run security disabled tests"
    yarn cypress:run-without-security --browser $CYPRESS_BROWSER --spec $SPEC
  fi
}
