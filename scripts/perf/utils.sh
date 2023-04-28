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
  while [ ! -f $1 ] || ! grep -q "$2" $1; do 
     if [ -f $1 ]; then rm $1; fi  
     curl $3 $4 > $1 || true
  done
  rm $1
}

function get_dashboards_package_version() {
  DASHBOARDS_PACKAGE_VERSION=$(cat $DASHBOARDS_DIR/package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d [:space:])
  
  echo "$DASHBOARDS_PACKAGE_VERSION"
}

function upload_results(){
  DASHBOARDS_PACKAGE_VERSION=$(cat $DASHBOARDS_DIR/package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d [:space:])

  INDEX="osd-stats-$DASHBOARDS_PACKAGE_VERSION"
  curl -X PUT $OPENSEARCH_BASE_URL/$INDEX $OPENSEARCH_ARGS >> /dev/null 2>&1  &
  while IFS="" read -r p || [ -n "$p" ]
  do
    curl -X POST $OPENSEARCH_BASE_URL/$INDEX/_doc -H "Content-Type: application/json" -d" $p"
  done < $STATS_PATH
}
