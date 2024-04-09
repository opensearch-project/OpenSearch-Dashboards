#!/bin/bash

set -e

OSD_TEST_PATH='cypress/integration/core_opensearch_dashboards'

function usage() {
    echo ""
    echo "This script is used to run integration tests for OpenSearch Dashboards cypress tests on a remote OpenSearch/Dashboards cluster on a Build CI."
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Required arguments:"
    echo "None"
    echo ""
    echo "Optional arguments:"
    echo -e "-b BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 9200 or 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-s SECURITY_ENABLED\t(true | false), defaults to false. Specify the OpenSearch/Dashboards have security enabled or not."
    echo -e "-c CREDENTIAL\t(usename:password), no defaults, effective when SECURITY_ENABLED=true."
    echo -e "-t TEST_COMPONENTS\t(OpenSearch-Dashboards reportsDashboards etc.), optional, specify test components, separate with space, else test everything."
    echo -e "-v VERSION\t, no defaults, indicates the OpenSearch version to test."
    echo -e "-o OPTION\t, no defaults, determine the TEST_TYPE value among(default, manifest) in test_finder.sh, optional."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":hb:p:s:c:t:v:o:" arg; do
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
        t)
            TEST_COMPONENTS=$OPTARG
            ;;
        v)
            VERSION=$OPTARG
            ;;
        o)
            OPTION=$OPTARG
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

if [ -z "$SECURITY_ENABLED" ]
then
  SECURITY_ENABLED="true"
fi

if [ -z "$CREDENTIAL" ]
then
  # Starting in 2.12.0, security demo configuration script requires an initial admin password
  CREDENTIAL="admin:myStrongPassword123!"
fi

USERNAME=`echo $CREDENTIAL | awk -F ':' '{print $1}'`
PASSWORD=`echo $CREDENTIAL | awk -F ':' '{print $2}'`

npm install

TEST_TYPE=$OPTION
TEST_FILES_EXT_LOCAL="**/*.js"
TEST_FILES="$OSD_TEST_PATH/$TEST_FILES_EXT_LOCAL"
echo -e "Test Files List:"
echo $TEST_FILES | tr ',' '\n'
echo "BROWSER_PATH: $BROWSER_PATH"

## WARNING: THIS LOGIC NEEDS TO BE THE LAST IN THIS FILE! ##
# Cypress returns back the test failure count in the error code
# The CI outputs the error code as test failure count.
#
# We need to ensure the cypress tests are the last execute process to
# the error code gets passed to the CI.

if [ "$SECURITY_ENABLED" = "true" ]
then
   echo "run security enabled tests"
   yarn cypress:run-with-security --browser "$BROWSER_PATH" --spec "$TEST_FILES"
else
   echo "run security disabled tests"
   yarn cypress:run-without-security --browser "$BROWSER_PATH" --spec "$TEST_FILES"
fi
