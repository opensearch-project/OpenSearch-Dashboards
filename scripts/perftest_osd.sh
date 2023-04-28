#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

. scripts/perf/utils.sh
. scripts/perf/opensearch_service.sh
. scripts/perf/opensearch_dashboards_service.sh

# If not defining test suite, it will default to this group of tests
DEFAULT_TESTS="core-opensearch-dashboards/opensearch-dashboards/*.js"
DEFAULT_INTERVAL=5

function usage() {
    echo ""
    echo "This script is used to run performance tests for OpenSearch Dashboards"
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Required arguments:"
    echo -e "-o OPENSEARCH\t, Specify the tested OpenSearch."
    echo -e "-d DASHBOARDS\t, Specify the tested OpenSearch Dashboards."
    echo ""
    echo "Optional arguments:"
    echo -e "-b BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-s SECURITY_ENABLED\t(true | false), defaults to true. Specify the OpenSearch/Dashboards have security enabled or not."
    echo -e "-c CREDENTIAL\t(usename:password), no defaults, effective when SECURITY_ENABLED=true."
    echo -e "-u UPLOAD_RESULTS\t(true | false), defaults to false. Upload stats results from perf_tmp to running OpenSearch"
    echo -e "-t TESTS\t, defaults to core tests. Specify tests in cypress/integration folder as a CSV to execute tests."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":h:b:p:s:c:u:t:o:d:" arg; do
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
        s)
            SECURITY_ENABLED=$OPTARG
            ;;
        c)
            CREDENTIAL=$OPTARG
            ;;
        u)
            UPLOAD_RESULTS=$OPTARG
            ;;
        t)
            TESTS=$OPTARG
            ;;
        o)
            OPENSEARCH=$OPTARG
            ;;    
        d)
            DASHBOARDS=$OPTARG
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
[ -z "$BIND_PORT" ] && BIND_PORT="5601"
[ -z "$SECURITY_ENABLED" ] && SECURITY_ENABLED="false"
[ -z "$CREDENTIAL" ] && CREDENTIAL="admin:admin"
[ -z "$UPLOAD_RESULTS" ] && UPLOAD_RESULTS="false"
[ -z "$TESTS" ] && TESTS=$DEFAULT_TESTS

TOTAL_TEST_FAILURES=0
# OpenSearch and OpenSearch Dashboards Process IDs
PARENT_PID_LIST=()
# define test path
CWD=$(pwd)
DIR="$CWD/perf_tmp"
TEST_DIR="$DIR/test"
LOGS_DIR="$TEST_DIR/cypress/results/local-cluster-logs"
STATS_DIR="$TEST_DIR/cypress/results/stats"
OPENSEARCH_DIR="$DIR/opensearch"
DASHBOARDS_DIR="$DIR/opensearch-dashboards"
[ ! -d "$DIR" ] && mkdir "$DIR"
[ ! -d "$TEST_DIR" ] && mkdir "$TEST_DIR"
[ -d "$OPENSEARCH_DIR" ] && [ $UPLOAD_RESULTS == "false" ] && rm -rf "$OPENSEARCH_DIR"
[ $UPLOAD_RESULTS == "false" ] && mkdir "$OPENSEARCH_DIR"
[ -d "$DASHBOARDS_DIR" ] && [ $UPLOAD_RESULTS == "false" ] && rm -rf "$DASHBOARDS_DIR"
[ $UPLOAD_RESULTS == "false" ] && mkdir "$DASHBOARDS_DIR"
[ -d "$STATS_DIR" ] && [ $UPLOAD == "false" ] && rm -rf "$STATS_DIR"

# define other paths and tmp files
OPENSEARCH_FILE='opensearch.txt'
DASHBOARDS_FILE='dashboards.txt'
STATS_FILE='stats.txt'
OPENSEARCH_PATH="$DIR/$OPENSEARCH_FILE"
DASHBOARDS_PATH="$DIR/$DASHBOARDS_FILE"
STATS_PATH="$STATS_DIR/$STATS_FILE"
DASHBOARDS_MSG="\"state\":\"green\",\"title\":\"Green\",\"nickname\":\"Looking good\",\"icon\":\"success\""
DASHBOARDS_BASE_URL="http://$BIND_ADDRESS:$BIND_PORT"
DASHBOARDS_URL="$DASHBOARDS_BASE_URL/api/status"
if [ $SECURITY_ENABLED == "false" ]; 
then 
  OPENSEARCH_MSG="\"status\":\"green\""
  OPENSEARCH_BASE_URL="http://$BIND_ADDRESS:9200"
  OPENSEARCH_URL="$OPENSEARCH_BASE_URL/_cluster/health"
  OPENSEARCH_ARGS=""
else 
  OPENSEARCH_MSG="\"status\":\"yellow\""
  OPENSEARCH_BASE_URL="https://$BIND_ADDRESS:9200"
  OPENSEARCH_URL="$OPENSEARCH_BASE_URL/_cluster/health"
  OPENSEARCH_ARGS="-u $CREDENTIAL --insecure"
fi

if [ $UPLOAD_RESULTS == "true" ]; then
  upload_results
  echo ""
  echo "Upload results complete"
  exit 0
fi

# un-tar OpenSearch and OpenSearch Dashboards
echo "[ unzip OpenSearch and OpenSearch Dashboards ]"
echo $OPENSEARCH
open_artifact $OPENSEARCH_DIR $OPENSEARCH
open_artifact $DASHBOARDS_DIR $DASHBOARDS

# this function sets up the cypress env
function setup_cypress() {
  echo "[ Setup the cypress test environment ]"
  git clone --depth=1 https://github.com/opensearch-project/opensearch-dashboards-functional-test "$TEST_DIR"
  [ ! -d "$LOGS_DIR" ] && mkdir -p "$LOGS_DIR"
  [ ! -d "$STATS_DIR" ] && mkdir -p "$STATS_DIR"
  cd "$TEST_DIR"
  npm install
  echo "Cypress is ready!"
}

function run_cypress() {
    TEST_ARRAY=("$@")
    SPEC_FILES=""
    for test in "${TEST_ARRAY[@]}"
    do
      SPEC_FILES+="$TEST_DIR/cypress/integration/$test,"
    done
    success_msg="PERF tests for core passed ($SPEC_FILES)"
    error_msg="PERF tests for core failed ($SPEC_FILES)"
    [ "$CI" == '1' ] && cypress_args="--browser chromium" || cypress_args=""
    env NO_COLOR=1 npx cypress run $cypress_args --headless --spec $SPEC_FILES --env SECURITY_ENABLED=$SECURITY_ENABLED,openSearchUrl=$OPENSEARCH_BASE_URL || test_failures=$?
    [ -z $test_failures ] && test_failures=0
    [ $test_failures == 0 ] && echo $success_msg || echo "$error_msg::TEST_FAILURES: $test_failures"
    TOTAL_TEST_FAILURES=$(( $TOTAL_TEST_FAILURES + $test_failures ))
}

# Runs the PERF test using cypress for the required version
function run_perf() {
  cd "$TEST_DIR"
  IFS=',' read -r -a cypress_tests <<<"$TESTS"
  run_cypress "${cypress_tests[@]}"
}

function get_stats() {
  while ps -p "${PARENT_PID_LIST[1]}" > /dev/null; do
    get_dashboards_stats
    sleep $DEFAULT_INTERVAL
  done
}

# Main function
function execute_tests() {
  setup_opensearch >> /dev/null 2>&1  &
  setup_dashboards >> /dev/null 2>&1  &

  run_opensearch
  check_opensearch_status
  run_dashboards
  check_dashboards_status

  get_stats >> /dev/null 2>&1  &
  run_perf

  # kill the running OpenSearch process
  clean
}
 
# setup the cypress test env
[ ! -d "$TEST_DIR/cypress" ] && setup_cypress

execute_tests
echo "Completed PERF tests"
echo "Total test failures: $TOTAL_TEST_FAILURES"
exit $TOTAL_TEST_FAILURES