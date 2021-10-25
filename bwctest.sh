#!/bin/bash

set -e

function usage() {
    echo ""
    echo "This script is used to run bwc tests on a remote OpenSearch/Dashboards cluster."
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Required arguments:"
    echo "None"
    echo ""
    echo "Optional arguments:"
    echo -e "-a BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 9200 or 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-b BUNDLED_OSD\t(true | false), defaults to true. Specify the usage of bundled Dashboards or not."
    echo -e "-c CREDENTIAL\t(usename:password), no defaults, effective when SECURITY_ENABLED=true."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":ha:p:b:c:" arg; do
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
            BUNDLED_OSD=$OPTARG
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


if [ -z "$BIND_ADDRESS" ]
then
  BIND_ADDRESS="localhost"
fi

if [ -z "$BIND_PORT" ]
then
  BIND_PORT="5601"
fi

if [ -z "$BUNDLED_OSD" ]
then
  BUNDLED_OSD="true"
fi

if [ -z "$CREDENTIAL" ]
then
  CREDENTIAL="admin:admin"
  USERNAME=`echo $CREDENTIAL | awk -F ':' '{print $1}'`
  PASSWORD=`echo $CREDENTIAL | awk -F ':' '{print $2}'`
fi

cwd=$(pwd)
dir="bwc-tmp"
if [ -d "$dir" ]; then
  rm -rf "$dir"
  echo "bwc-tmp exists and needs to be removed"
fi

mkdir "$dir"
git clone https://github.com/opensearch-project/opensearch-dashboards-functional-test "$dir"
rm -rf "$dir/cypress"
cp -r cypress "$dir"
cd "$dir"

npm install

if [ $BUNDLED_OSD = "true" ]
then
   echo "run security enabled tests"
   npx cypress run --spec "$cwd/bwc-tmp/cypress/integration/bundled-osd/*.js"
else
   npx cypress run --spec "$cwd/bwc-tmp/cypress/integration/osd/*.js"
fi

rm -rf "$cwd/$dir"