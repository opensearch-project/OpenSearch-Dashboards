#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

function usage() {
    echo ""
    echo "This script is used to run backwards compatibility tests on a remote OpenSearch/Dashboards cluster."
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Required arguments:"
    echo "None"
    echo ""
    echo "Optional arguments:"
    echo -e "-a BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 9200 or 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-b BUNDLED_DASHBOARDS\t(true | false), defaults to false. Specify the usage of bundled Dashboards or not."
    echo -e "-v VERSIONS\t(true | false), defaults to a defind test array in the script. Specify the versions of the tested Dashboards. It could be a single version or multiple."
    echo -e "-o OPENSEARCH\t, no defaults and must provide. Specify the tested OpenSearch which must be named opensearch and formatted as tar.gz."
    echo -e "-d DASHBOARDS\t, no defaults and must provide. Specify the tested Dashboards which must be named opensearch-dashboards and formatted as tar.gz."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":ha:p:b:v:o:d:" arg; do
    case $arg in
        h)
            usage
            exit 1
            ;;
        a)
            BIND_ADDRESS=$OPTARG
            ;;
        p)
            BIND_PORT=$OPTARG
            ;;    
        b)
            BUNDLED_DASHBOARDS=$OPTARG
            ;;
        v)
            VERSIONS=$OPTARG
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

if [ -z "$BIND_ADDRESS" ]
then
  BIND_ADDRESS="localhost"
fi

if [ -z "$BIND_PORT" ]
then
  BIND_PORT="5601"
fi

if [ -v "VERSIONS" ]
then
  test_array=($VERSIONS)  
else
  test_array=("odfe-0.10.0" "odfe-1.0.2" "odfe-1.1.0" "odfe-1.2.1" "odfe-1.3.0" "odfe-1.4.0" "odfe-1.7.0" "odfe-1.8.0" "odfe-1.9.0" "odfe-1.11.0" "odfe-1.13.2" "osd-1.0.0" "osd-1.1.0")  
fi

if [ -z "$BUNDLED_DASHBOARDS" ]
then
  BUNDLED_DASHBOARDS="false"    
fi

if [ $BUNDLED_DASHBOARDS == "false" ]
then
  dashboards_type="osd"
else
  dashboards_type="osd-bundle"
fi    

# define test path
cwd=$(pwd)
dir="$cwd/bwc-tmp"
test_dir="$dir/test"
if [ -d "$dir" ]; then
  echo "bwc-tmp exists and needs to be removed"   
  rm -rf "$dir"
fi
mkdir "$dir"
mkdir "$test_dir"

# unzip opensearch and dashboards
echo "[ unzip opensearch and dashboards ]"
cd "$dir"
cp $OPENSEARCH $dir
cp $DASHBOARDS $dir

IFS='/' read -ra ADDR <<< "$OPENSEARCH"
opensearch_tar=${ADDR[-1]}
tar -xvf $opensearch_tar >> /dev/null 2>&1
IFS='.' read -ra ADDR <<< "$opensearch_tar"
opensearch=${ADDR[0]}

IFS='/' read -ra ADDR <<< "$DASHBOARDS"
dashboards_tar=${ADDR[-1]}
tar -xvf $dashboards_tar >> /dev/null 2>&1
IFS='.' read -ra ADDR <<< "$dashboards_tar"
dashboards=${ADDR[0]}

# define other paths and tmp files
opensearch_dir="$dir/$opensearch"
dashboards_dir="$dir/$dashboards"
opensearch_file='opensearch.txt'
dashboards_file='dashboards.txt'
opensearch_path="$dir/$opensearch_file"
if [ $BUNDLED_DASHBOARDS == "false" ]; then opensearch_msg="\"status\":\"green\""; else opensearch_msg="\"status\":\"yellow\""; fi
dashboards_path="$dir/$dashboards_file"
dashboards_msg="\"state\":\"green\",\"title\":\"Green\",\"nickname\":\"Looking good\",\"icon\":\"success\""
if [ $BUNDLED_DASHBOARDS == "false" ]; then opensearch_url="http://localhost:9200/_cluster/health"; else opensearch_url="https://localhost:9200/_cluster/health"; fi
if [ $BUNDLED_DASHBOARDS == "false" ]; then opensearch_args=""; else opensearch_args="-u admin:admin --insecure"; fi
dashboards_url="http://localhost:5601/api/status"

# define test groups and suites
test_group_1="check_loaded_data,check_timeline"
test_group_2="check_advanced_settings,check_loaded_data,check_timeline"
test_group_3="check_advanced_settings,check_filter_and_query,check_loaded_data,check_timeline"
test_group_4="check_advanced_settings,check_default_page,check_filter_and_query,check_loaded_data,check_timeline"

declare -A test_suites
test_suites=(
  ["odfe-0.10.0"]=$test_group_1 
  ["odfe-1.0.2"]=$test_group_2 
  ["odfe-1.1.0"]=$test_group_2
  ["odfe-1.2.1"]=$test_group_2
  ["odfe-1.3.0"]=$test_group_2
  ["odfe-1.4.0"]=$test_group_3
  ["odfe-1.7.0"]=$test_group_3
  ["odfe-1.8.0"]=$test_group_3
  ["odfe-1.9.0"]=$test_group_3
  ["odfe-1.11.0"]=$test_group_3
  ["odfe-1.13.2"]=$test_group_4
  ["osd-1.0.0"]=$test_group_4
  ["osd-1.1.0"]=$test_group_4
)

# remove the running opensearch process
function clean {
  echo "close running opensearcn"
  process=($(ps -ef | grep "Dopensearch" | awk '{print $2}'))
  kill ${process[0]}
  echo "close any usage on port 5601"
  process=($(lsof -i -P -n | grep 5601 | awk '{print $2}'))
  kill ${process[0]}
}

# this is a support funtion to print out a text file line by line
function print_txt {
  while IFS= read -r line; do
    echo "text read from $1: $line"
  done < $1
}

# this function is used to check the opensearch or dashboards running status
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
  git clone https://github.com/opensearch-project/opensearch-dashboards-functional-test "$test_dir"
  rm -rf "$test_dir/cypress/integration"
  cp -r "$cwd/cypress/integration" "$test_dir/cypress"
  cd "$test_dir"
  npm install
}

# this function copies the tested data for the required version to the opensearch data folder
# $1 is the required version
function upload_data {
  rm -rf "$opensearch_dir/data"
  cd $opensearch_dir
  cp "$cwd/cypress/test-data/$dashboards_type/$1.tar.gz" . 
  tar -xvf "$opensearch_dir/$1.tar.gz" >> /dev/null 2>&1
  rm "$1.tar.gz"
  echo "ready to test"
}

# this function starts opensearch
function run_opensearch {
  cd "$opensearch_dir"
  ./bin/opensearch
}

# this function starts dashboards
function run_dashboards {
  cd "$dashboards_dir"
  ./bin/opensearch-dashboards 
}

# this function checks the opensearch running status 
# it calls check_status and passes the opensearch tmp file path, error msg, url, and arguments
# if success, the while loop in the check_status will end and it prints out "opensearch is up"
function check_opensearch_status {
  cd "$dir"
  check_status $opensearch_path "$opensearch_msg" $opensearch_url "$opensearch_args" >> /dev/null 2>&1
  echo "opensearch is up" 
} 

# this function checks the dashboards running status 
# it calls check_status and passes the dashboards tmp file path, error msg, url, and arguments
# if success, the while loop in the check_status will end and it prints out "dashboards is up"
function check_dashboards_status {  
  cd "$dir"
  check_status $dashboards_path "$dashboards_msg" $dashboards_url "" >> /dev/null 2>&1
  echo "dashboards is up"
} 

# this function will run backwards compatibility test using cypress for the required version
# $1 is the requested version 
function run_bwc {
  cd "$test_dir"
  IFS=',' read -r -a tests <<< "${test_suites[$1]}"
  for test in "${tests[@]}"
  do
     npx cypress run --spec "$cwd/bwc-tmp/test/cypress/integration/$dashboards_type/$test.js" || echo "backwards compatibility tests have issue"
  done
}
 
# setup the cypress test env
echo "[ setup the cypress test env ]"
setup_cypress
echo "cypress is ready"

# for each required testing version, do the following
# first run opensearch and check the status
# second run dashboards and check the status
# run the backwards compatibility tests
for i in ${!test_array[@]}; 
do
  version=${test_array[$i]}
  # setup the opensearch env
  # copy and unzip data in the opensearch data folder
  echo "[ set up the opensearch env for $version ]"
  upload_data $version
  
  echo "[ start opensearch and wait ]"
  run_opensearch >> /dev/null 2>&1  &
  
  echo "check the opensearch status"
  check_opensearch_status
  
  echo "[ start dashboards and wait ]"
  run_dashboards >> /dev/null 2>&1 & 
  
  echo "check the dashboards status"
  check_dashboards_status
  
  echo "[ run the backwards compatibility tests for $version ]"
  run_bwc $version
 
  # kill the running opensearch process
  clean
done  

rm -rf "$dir"