#!/bin/bash

set -e

# TODO: Update with -latest from distributions
DEFAULT_OPENSEARCH="https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/2.0.0/676/linux/x64/dist/opensearch/opensearch-2.0.0-linux-x64.tar.gz"
# TODO: Update to include all know BWC of data
DEFAULT_VERSIONS="osd-1.1.0"

function usage() {
    echo ""
    echo "This script is used to run bwc tests on a remote OpenSearch/Dashboards cluster."
    echo "--------------------------------------------------------------------------"
    echo "Usage: $0 [args]"
    echo ""
    echo "Required arguments:"
    echo -e "-d DASHBOARDS\t, Specify the url of the build/dist of OpenSearch Dashboards"
    echo ""
    echo "Optional arguments:"
    echo -e "-o OPENSEARCH\t, Specify the url of the build/dist of OpenSearch"
    echo -e "-a BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 9200 or 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-s SECURITY_ENABLED\t(true | false), defaults to true. Specify the OpenSearch/Dashboards have security enabled or not."
    echo -e "-c CREDENTIAL\t(usename:password), no defaults, effective when SECURITY_ENABLED=true."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":h:a:p:s:c:o:d:" arg; do
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
        s)
            SECURITY_ENABLED=$OPTARG
            ;;
        c)
            CREDENTIAL=$OPTARG
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
[ -z "$OPENSEARCH" ] && OPENSEARCH=$DEFAULT_OPENSEARCH

./scripts/bwctest_osd.sh -a $BIND_ADDRESS -p $BIND_PORT -s $SECURITY_ENABLED -c $CREDENTIAL -o $OPENSEARCH -d $DASHBOARDS -v $DEFAULT_VERSIONS
