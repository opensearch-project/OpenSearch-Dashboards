#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

. scripts/assistant/utils.sh
. scripts/assistant/add_model.sh

function usage() {
    echo ""
    echo "This script is used to run OpenSearch Assistant"
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Optional arguments:"
    echo -e "-b BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-c CREDENTIAL\t(password), defaults to admin"
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":h:b:p:c:" arg; do
    case $arg in
        h)
            usage
            exit 1
            ;;
        b)
            BIND_ADDRESS=$OPTARG
            ;;
        p)
            BIND_PORT=$OPTARG
            ;;
        c)
            CREDENTIAL=$OPTARG
            ;;
        :)
            echo "-${OPTARG} requires an argument"
            usage
            exit 1
            ;;
        ?)
            echo "Invalid option: -${OPTARG}"
            exit 1
            ;;
    esac
done

[ -z "$BIND_ADDRESS" ] && BIND_ADDRESS="localhost"
[ -z "$BIND_PORT" ] && BIND_PORT="9200"
[ -z "$CREDENTIAL" ] && CREDENTIAL="admin"
[ -z "$REGION" ] && REGION="us-west-2"

PARENT_PID_LIST=()

PACKAGE_VERSION=$(yarn --silent pkg-version)

# define assistant path
CWD=$(pwd)
SNAPSHOT_DIR="$CWD/.opensearch"
LOGS_DIR="$SNAPSHOT_DIR/$PACKAGE_VERSION/logs"

# Main function
function execute() {
  export initialAdminPassword=$CREDENTIAL
  CLUSTER_SETTINGS="snapshot --assistant --security"
  CLUSTER_SETTINGS+=" -E plugins.ml_commons.only_run_on_ml_node=true"
  
  run_opensearch || clean
  check_opensearch_status
  echo "Attempting to add models..."
  echo "(Ensure your environment is exporting your credentials)"
  (add_model > $LOGS_DIR/add_model.log 2>&1 || clean) & 

  export OPENSEARCH_USERNAME=kibanaserver
  export OPENSEARCH_PASSWORD=kibanaserver
  $CWD/scripts/use_node $CWD/scripts/opensearch_dashboards --dev --security || clean
}

execute
clean
exit 0