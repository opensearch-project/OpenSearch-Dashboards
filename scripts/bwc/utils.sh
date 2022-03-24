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

# this function copies the tested data for the required version to the opensearch data folder
# $1 is the required version
function upload_data() {
  rm -rf "$OPENSEARCH_DIR/data"
  cd $OPENSEARCH_DIR
  cp "$CWD/cypress/test-data/$DASHBOARDS_TYPE/$1.tar.gz" . 
  tar -xvf "$OPENSEARCH_DIR/$1.tar.gz" >> /dev/null 2>&1
  rm "$1.tar.gz"
  echo "Data has been uploaded and ready to test"
}
