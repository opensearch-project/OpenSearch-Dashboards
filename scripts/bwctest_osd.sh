#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

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
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":h:b:p:s:c:v:r:o:d:" arg; do
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
[ -z "$VERSIONS" ] && test_array=("${DEFAULT_VERSIONS[@]}") || IFS=',' read -r -a test_array <<<"$VERSIONS"
[ -z "$SECURITY_ENABLED" ] && SECURITY_ENABLED="false"
[ $SECURITY_ENABLED == "false" ] && dashboards_type="without-security" || dashboards_type="with-security"
[ $SECURITY_ENABLED == "false" ] && releases_array=() || IFS=',' read -r -a releases_array <<<"$RELEASES"
[ -z "$CREDENTIAL" ] && CREDENTIAL="admin:admin"

# define test path
cwd=$(pwd)
dir="$cwd/bwc_tmp"
test_dir="$dir/test"
opensearch_dir="$dir/opensearch"
dashboards_dir="$dir/opensearch-dashboards"
if [ -d "$dir" ]; then
  echo "Temporary directory exists. Removing."   
  rm -rf "$dir"
fi
mkdir "$dir"
mkdir "$test_dir"
mkdir "$opensearch_dir"
mkdir "$dashboards_dir"

function open_artifact {
  artifact_dir=$1
  artifact=$2
  cd $artifact_dir
  
  # check if artifact provided is URL or attempt if passing by absolute path
  if wget -q --method=HEAD $artifact; then
    wget -c $artifact -O - | tar -xz --strip-components=1
  else
    tar -xf $artifact --strip-components=1
  fi

}

# un-tar OpenSearch and OpenSearch Dashboards
echo "[ unzip OpenSearch and OpenSearch Dashboards ]"
open_artifact $opensearch_dir $OPENSEARCH
open_artifact $dashboards_dir $DASHBOARDS

# define other paths and tmp files
opensearch_file='opensearch.txt'
dashboards_file='dashboards.txt'
opensearch_path="$dir/$opensearch_file"
dashboards_path="$dir/$dashboards_file"
dashboards_msg="\"state\":\"green\",\"title\":\"Green\",\"nickname\":\"Looking good\",\"icon\":\"success\""
dashboards_url="http://$BIND_ADDRESS:$BIND_PORT/api/status"
if [ $SECURITY_ENABLED == "false" ]; 
then 
  opensearch_msg="\"status\":\"green\""
  opensearch_url="http://$BIND_ADDRESS:9200/_cluster/health"
  opensearch_args=""
else 
  opensearch_msg="\"status\":\"yellow\""
  opensearch_url="https://$BIND_ADDRESS:9200/_cluster/health"
  opensearch_args="-u $CREDENTIAL --insecure"
fi

# define test groups to test suites
declare -A test_suites
test_suites=(
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
)

# remove the running opensearch process
function clean {
  echo "Closing the running OpenSearch"
  process=($(ps -ef | grep "Dopensearch" | awk '{print $2}'))
  kill ${process[0]}
  echo "Closing any usage on port $BIND_PORT"
  process=($(lsof -i -P -n | grep $BIND_PORT | awk '{print $2}'))
  kill ${process[0]}
}

# Print out a textfile line by line
function print_txt {
  while IFS= read -r line; do
    echo "text read from $1: $line"
  done < $1
}

# this function is used to check the running status of OpenSearch or OpenSearch Dashboards
# $1 is the path to the tmp file which saves the running status 
# $2 is the error msg to check
# $3 is the url to curl
# $4 contains arguments that need to be passed to the curl command
function check_status {
  while [ ! -f $1 ] || ! grep -q "$2" $1; do 
     if [ -f $1 ]; then rm $1; fi  
     curl $3 $4 > $1 || true
  done
  rm $1
}

# this function sets up the cypress env
# it first clones the opensearch-dashboards-functional-test library
# then it removes the tests into the cypress integration folder 
# and copies the backwards compatibility tests into the folder
function setup_cypress {
  echo "[ Setup the cypress test environment ]"
  git clone https://github.com/opensearch-project/opensearch-dashboards-functional-test "$test_dir"
  rm -rf "$test_dir/cypress/integration"
  cp -r "$cwd/cypress/integration" "$test_dir/cypress"
  cd "$test_dir"
  npm install
  echo "Cypress is ready!"
}

# this function copies the tested data for the required version to the opensearch data folder
# $1 is the required version
function upload_data {
  rm -rf "$opensearch_dir/data"
  cd $opensearch_dir
  cp "$cwd/cypress/test-data/$dashboards_type/$1.tar.gz" . 
  tar -xvf "$opensearch_dir/$1.tar.gz" >> /dev/null 2>&1
  rm "$1.tar.gz"
  echo "Data has been uploaded and ready to test"
}

# Starts OpenSearch, if verifying a distribution it will install the certs then start.
function run_opensearch {
  echo "[ Attempting to start OpenSearch... ]"
  cd "$opensearch_dir"
  [ $SECURITY_ENABLED == "false" ] && ./bin/opensearch || ./opensearch-tar-install.sh
}

# Starts OpenSearch Dashboards
function run_dashboards {
  echo "[ Attempting to start OpenSearch Dashboards... ]"
  cd "$dashboards_dir"
  [ $SECURITY_ENABLED == "false" ] && rm config/opensearch_dashboards.yml && touch config/opensearch_dashboards.yml
  ./bin/opensearch-dashboards 
}

# Checks the running status of OpenSearch
# it calls check_status and passes the OpenSearch tmp file path, error msg, url, and arguments
# if success, the while loop in the check_status will end and it prints out "OpenSearch is up!"
function check_opensearch_status {
  echo "Checking the status OpenSearch..."
  cd "$dir"
  check_status $opensearch_path "$opensearch_msg" $opensearch_url "$opensearch_args" >> /dev/null 2>&1
  echo "OpenSearch is up!" 
} 

# Checks the running status of OpenSearch Dashboards
# it calls check_status and passes the OpenSearch Dashboards tmp file path, error msg, url, and arguments
# if success, the while loop in the check_status will end and it prints out "OpenSearch Dashboards is up!"
function check_dashboards_status {
  echo "Checking the OpenSearch Dashboards..."
  cd "$dir"
  check_status $dashboards_path "$dashboards_msg" $dashboards_url "" >> /dev/null 2>&1
  echo "OpenSearch Dashboards is up!"
} 

# Runs the backwards compatibility test using cypress for the required version
# $1 is the requested version 
function run_bwc {
  cd "$test_dir"
  [ -z "${test_suites[$1]}" ] && test_suite=$TEST_GROUP_DEFAULT || test_suite="${test_suites[$1]}"
  IFS=',' read -r -a tests <<<"$test_suite"
  for test in "${tests[@]}"
  do
    npx cypress run --spec "$test_dir/cypress/integration/$dashboards_type/$test.js" || echo "backwards compatibility tests have issue"
  done
  # Check if $dashboards_type/plugins has tests in them to execute
  if [ "$(ls -A $test_dir/cypress/integration/$dashboards_type/plugins | wc -l)" -gt 1 ]; then
    echo "Running tests from plugins"
    npx cypress run --spec "$test_dir/cypress/integration/$dashboards_type/plugins/*.js" || echo "backwards compatibility plugins tests have issue"
  fi
}

# Main function
function execute_tests {
  # for each required testing version, do the following
  # first run opensearch and check the status
  # second run dashboards and check the status
  # run the backwards compatibility tests
  for version in "${test_array[@]}"
  do
    # copy and un-tar data into the OpenSearch data folder
    echo "[ Setting up the OpenSearch environment for $version ]"
    upload_data $version
    
    run_opensearch >> /dev/null 2>&1  &  
    check_opensearch_status
    run_dashboards >> /dev/null 2>&1 & 
    check_dashboards_status
    
    echo "[ Run the backwards compatibility tests for $version ]"
    run_bwc $version
  
    # kill the running OpenSearch process
    clean
  done  
}

# Executes the main function with different versions of OpenSearch downloaded
function execute_mismatch_tests {
  PACKAGE_VERSION=$(cat $dashboards_dir/package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d [:space:])

  for release in "${releases_array[@]}"
  do
    echo "Running tests with OpenSearch Dashboards $PACKAGE_VERSION and OpenSearch $release"
    (
      rm -rf $opensearch_dir && mkdir "$opensearch_dir"
      # TODO: support multiple platforms and architectures
      cd $opensearch_dir && wget -c https://artifacts.opensearch.org/releases/bundle/opensearch/$release/opensearch-$release-linux-x64.tar.gz -O - | tar -xz --strip-components=1
    )
    execute_tests
  done
}
 
# setup the cypress test env
setup_cypress
execute_tests
(( ${#releases_array[@]} )) && execute_mismatch_tests

rm -rf "$dir"