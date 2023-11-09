#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

function open_artifact() {
  artifact_dir=$1
  artifact=$2
  cd $artifact_dir

  # check if artifact provided is URL or attempt if passing by absolute path
  if curl -I -L $artifact; then
    curl -L $artifact | tar -xz --strip-components=1
  else
    echo "Artifact is not a URL; attempting to unarchive a local file..."
    tar -xf $artifact --strip-components=1
  fi
}

# remove the running opensearch process
function clean() {
  echo "Attempt to Terminate Process with PID: ${PARENT_PID_LIST[*]}"
  for pid_kill in "${PARENT_PID_LIST[@]}"
  do
    echo "Closing PID $pid_kill"
    kill $pid_kill || true
  done
  PARENT_PID_LIST=()
}

function spawn_process_and_save_PID() {
    echo "Spawn '$@'"
    eval $@
    curr_pid=$!
    echo "PID: $curr_pid"
    PARENT_PID_LIST+=( $curr_pid )
}

# Print out a textfile line by line
function print_txt() {
  while IFS= read -r line; do
    echo "text read from $1: $line"
  done < $1
}

# this function is used to check the running status of OpenSearch or OpenSearch Dashboards
# $1 is the path to the tmp file which saves the running status
# $2 is the error msg to check
# $3 is the url to curl
# $4 contains arguments that need to be passed to the curl command
function check_status() {
  # Calculate end time as 350s from now
  check_status_end_time=$(expr 350 + "$(date '+%s')")
  
  while [ ! -e $1 ] || ! grep -q "$2" $1; do
    sleep 1
    # Stop checking after $check_status_end_time
    if [ $check_status_end_time -lt $(date '+%s') ]; then
      echo "Error: Status check has timed out"
      exit 1
    fi
  done
}

# Checks the running status of OpenSearch
# it calls check_status and passes the OpenSearch tmp file path, error msg, url, and arguments
# if success, the while loop in the check_status will end and it prints out "OpenSearch is up!"
function check_opensearch_status() {
  echo "Checking the status OpenSearch..."
  # define other paths and tmp files
  OPENSEARCH_FILE='opensearch.log'
  OPENSEARCH_LOG_PATH="$LOGS_DIR/$OPENSEARCH_FILE"
  
  OPENSEARCH_MSG="ML configuration initialized successfully"
  check_status $OPENSEARCH_LOG_PATH "$OPENSEARCH_MSG" 2>&1
  echo "OpenSearch is up!" 
}

# Starts OpenSearch
function run_opensearch() {
  echo "[ Attempting to start OpenSearch... ]"
  rm -rf $LOGS_DIR/opensearch.log 
  spawn_process_and_save_PID  "$CWD/scripts/use_node $CWD/scripts/opensearch $CLUSTER_SETTINGS > $LOGS_DIR/opensearch.log 2>&1 &"
}
