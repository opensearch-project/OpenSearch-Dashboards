#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

. scripts/bwc/utils.sh
. scripts/bwc/opensearch_service.sh
. scripts/bwc/opensearch_dashboards_service.sh
. scripts/bwc/generate_test_data.sh

# For every release, add sample data and new version below:
DEFAULT_VERSIONS=(
  "odfe-0.10.0"
  "odfe-1.0.2"
  "odfe-1.1.0"
  "odfe-1.2.1"
  "odfe-1.3.0"
  "odfe-1.4.0"
  "odfe-1.7.0"
  "odfe-1.8.0"
  "odfe-1.9.0"
  "odfe-1.11.0"
  "odfe-1.13.2"
  "osd-1.0.0"
  "osd-1.1.0"
  "osd-1.3.2"
  "osd-2.0.0"
)

# Define test groups
TEST_GROUP_1="check_loaded_data,check_timeline"
TEST_GROUP_2="$TEST_GROUP_1,check_advanced_settings"
TEST_GROUP_3="$TEST_GROUP_2,check_filter_and_query"
TEST_GROUP_4="$TEST_GROUP_3,check_default_page"
# If not defining test suite for a specific version, it will default to this group of tests
TEST_GROUP_DEFAULT="$TEST_GROUP_4"

function usage() {
    echo ""
    echo "This script is used to run backwards compatibility tests for OpenSearch Dashboards"
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
    echo -e "-v VERSIONS\t, Specify versions as a CSV to execute tests with data from specific version of OpenSearch Dashboards."
    echo -e "-r RELEASES\t, Specify versions as a CSV to execute tests for released versions of OpenSearch."
    echo -e "-g GENERATE_DATA\t(true | false), defaults to false. Specify to generate test data for BWC tests (will not execute tests)."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":h:b:p:s:c:v:r:g:o:d:" arg; do
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
        v)
            VERSIONS=$OPTARG
            ;;
        r)
            RELEASES=$OPTARG
            ;;
        g)
            GENERATE_DATA=$OPTARG
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
[ -z "$VERSIONS" ] && TEST_VERSIONS=("${DEFAULT_VERSIONS[@]}") || IFS=',' read -r -a TEST_VERSIONS <<<"$VERSIONS"
[ -z "$SECURITY_ENABLED" ] && SECURITY_ENABLED="false"
[ $SECURITY_ENABLED == "false" ] && DASHBOARDS_TYPE="without-security" || DASHBOARDS_TYPE="with-security"
[ $SECURITY_ENABLED == "false" ] && RELEASES_ARRAY=() || IFS=',' read -r -a RELEASES_ARRAY <<<"$RELEASES"
[ -z "$CREDENTIAL" ] && CREDENTIAL="admin:admin"
[ -z $GENERATE_DATA ] && GENERATE_DATA="false"

TOTAL_TEST_FAILURES=0
# OpenSearch and OpenSearch Dashboards Process IDs
PARENT_PID_LIST=()
# define test path
CWD=$(pwd)
DIR="$CWD/bwc_tmp"
TEST_DIR="$DIR/test"
LOGS_DIR="$TEST_DIR/cypress/results/local-cluster-logs"
OPENSEARCH_DIR="$DIR/opensearch"
DASHBOARDS_DIR="$DIR/opensearch-dashboards"
[ ! -d "$DIR" ] && mkdir "$DIR"
[ ! -d "$TEST_DIR" ] && mkdir "$TEST_DIR"
[ -d "$OPENSEARCH_DIR" ] && rm -rf "$OPENSEARCH_DIR"
mkdir "$OPENSEARCH_DIR"
[ -d "$DASHBOARDS_DIR" ] && rm -rf "$DASHBOARDS_DIR"
mkdir "$DASHBOARDS_DIR"

# un-tar OpenSearch and OpenSearch Dashboards
echo "[ unzip OpenSearch and OpenSearch Dashboards ]"
echo $OPENSEARCH
open_artifact $OPENSEARCH_DIR $OPENSEARCH
open_artifact $DASHBOARDS_DIR $DASHBOARDS

# define other paths and tmp files
OPENSEARCH_FILE='opensearch.txt'
DASHBOARDS_FILE='dashboards.txt'
OPENSEARCH_PATH="$DIR/$OPENSEARCH_FILE"
DASHBOARDS_PATH="$DIR/$DASHBOARDS_FILE"
DASHBOARDS_MSG="\"state\":\"green\",\"title\":\"Green\",\"nickname\":\"Looking good\",\"icon\":\"success\""
DASHBOARDS_URL="http://$BIND_ADDRESS:$BIND_PORT/api/status"
if [ $SECURITY_ENABLED == "false" ]; 
then 
  OPENSEARCH_MSG="\"status\":\"green\""
  OPENSEARCH_URL="http://$BIND_ADDRESS:9200/_cluster/health"
  OPENSEARCH_ARGS=""
else 
  OPENSEARCH_MSG="\"status\":\"yellow\""
  OPENSEARCH_URL="https://$BIND_ADDRESS:9200/_cluster/health"
  OPENSEARCH_ARGS="-u $CREDENTIAL --insecure"
fi

# define test groups to test suites
declare -A TEST_SUITES
TEST_SUITES=(
  ["odfe-0.10.0"]=$TEST_GROUP_1 
  ["odfe-1.0.2"]=$TEST_GROUP_2 
  ["odfe-1.1.0"]=$TEST_GROUP_2
  ["odfe-1.2.1"]=$TEST_GROUP_2
  ["odfe-1.3.0"]=$TEST_GROUP_2
  ["odfe-1.4.0"]=$TEST_GROUP_3
  ["odfe-1.7.0"]=$TEST_GROUP_3
  ["odfe-1.8.0"]=$TEST_GROUP_3
  ["odfe-1.9.0"]=$TEST_GROUP_3
  ["odfe-1.11.0"]=$TEST_GROUP_3
  ["odfe-1.13.2"]=$TEST_GROUP_4
  ["osd-1.0.0"]=$TEST_GROUP_4
  ["osd-1.1.0"]=$TEST_GROUP_4
  ["osd-1.3.2"]=$TEST_GROUP_4
  ["osd-2.0.0"]=$TEST_GROUP_4
)

# this function sets up the cypress env
# it first clones the opensearch-dashboards-functional-test library
# then it removes the tests into the cypress integration folder 
# and copies the backwards compatibility tests into the folder
function setup_cypress() {
  echo "[ Setup the cypress test environment ]"
  git clone --depth=1 https://github.com/opensearch-project/opensearch-dashboards-functional-test "$TEST_DIR"
  rm -rf "$TEST_DIR/cypress/integration"
  cp -r "$CWD/cypress/integration" "$TEST_DIR/cypress"
  [ ! -d "$LOGS_DIR" ] && mkdir -p "$LOGS_DIR"
  cd "$TEST_DIR"
  npm install
  echo "Cypress is ready!"
}

function run_cypress() {
    [ $1 == "core" ] && IS_CORE=true || IS_CORE=false
    TEST_ARRAY=("$@")
    SPEC_FILES=""
    for test in "${TEST_ARRAY[@]}"
    do
      SPEC_FILES+="$TEST_DIR/cypress/integration/$DASHBOARDS_TYPE/*$test.js,"
    done
    [ $IS_CORE == false ] && echo "Running tests from plugins"
    [ $IS_CORE == true ] && spec="$SPEC_FILES" || "$TEST_DIR/cypress/integration/$DASHBOARDS_TYPE/plugins/*.js"
    [ $IS_CORE == true ] && success_msg="BWC tests for core passed ($spec)" || success_msg="BWC tests for plugin passed ($spec)"
    [ $IS_CORE == true ] && error_msg="BWC tests for core failed ($spec)" || error_msg="BWC tests for plugin failed ($spec)"
    [ "$CI" == '1' ] && cypress_args="--browser chromium" || cypress_args=""
    env NO_COLOR=1 npx cypress run $cypress_args --headless --spec $spec || test_failures=$?
    [ -z $test_failures ] && test_failures=0
    [ $test_failures == 0 ] && echo $success_msg || echo "$error_msg::TEST_FAILURES: $test_failures"
    TOTAL_TEST_FAILURES=$(( $TOTAL_TEST_FAILURES + $test_failures ))
}

# Runs the backwards compatibility test using cypress for the required version
# $1 is the requested version 
function run_bwc() {
  cd "$TEST_DIR"
  [ -z "${TEST_SUITES[$1]}" ] && test_suite=$TEST_GROUP_DEFAULT || test_suite="${TEST_SUITES[$1]}"
  IFS=',' read -r -a tests <<<"$test_suite"

  # Check if $DASHBOARDS_TYPE/plugins has tests in them to execute
  if [ "$(ls -A $TEST_DIR/cypress/integration/$DASHBOARDS_TYPE/plugins | wc -l)" -gt 1 ]; then
    run_cypress "plugins"
  else 
    run_cypress "core" "${tests[@]}"
  fi
}

# generate test data
function generate_test_data() {
  setup_opensearch >> /dev/null 2>&1  &
  setup_dashboards >> /dev/null 2>&1  &

  run_opensearch
  check_opensearch_status
  run_dashboards
  check_dashboards_status

  run_generate_data_spec
  archive_data
  
  # kill the running OpenSearch process
  clean  
}

# Main function
function execute_tests() {
  setup_opensearch >> /dev/null 2>&1  &
  setup_dashboards >> /dev/null 2>&1  &

  # for each required testing version, do the following
  # first run opensearch and check the status
  # second run dashboards and check the status
  # run the backwards compatibility tests
  for version in "${TEST_VERSIONS[@]}"
  do
    # copy and un-tar data into the OpenSearch data folder
    echo "[ Setting up the OpenSearch environment for $version ]"
    upload_data $version
    
    run_opensearch
    check_opensearch_status
    run_dashboards
    check_dashboards_status
    
    echo "[ Run the backwards compatibility tests for $version ]"
    run_bwc $version
  
    # kill the running OpenSearch process
    clean
  done  
}

# Executes the main function with different versions of OpenSearch downloaded
function execute_mismatch_tests() {
  PACKAGE_VERSION=$(get_dashboards_package_version)

  for release in "${RELEASES_ARRAY[@]}"
  do
    echo "Running tests with OpenSearch Dashboards $PACKAGE_VERSION and OpenSearch $release"
    (
      rm -rf $OPENSEARCH_DIR && mkdir "$OPENSEARCH_DIR"
      # TODO: support multiple platforms and architectures
      cd $OPENSEARCH_DIR && curl https://artifacts.opensearch.org/releases/bundle/opensearch/$release/opensearch-$release-linux-x64.tar.gz | tar -xz --strip-components=1
    )
    execute_tests
  done
}
 
# setup the cypress test env
[ ! -d "$TEST_DIR/cypress" ] && setup_cypress
if [ $GENERATE_DATA == "true" ]; then
  generate_test_data
  echo "Generate data complete"
  exit 0
fi

execute_tests
(( ${#RELEASES_ARRAY[@]} )) && execute_mismatch_tests
echo "Completed BWC tests for $TEST_VERSIONS [$DASHBOARDS_TYPE]"
echo "Total test failures: $TOTAL_TEST_FAILURES"
exit $TOTAL_TEST_FAILURES