#!/bin/bash

#
# SPDX-License-Identifier: Apache-2.0
#
# The OpenSearch Contributors require contributions made to
# this file be licensed under the Apache-2.0 license or a
# compatible open source license.
#
# Any modifications Copyright OpenSearch Contributors. See
# GitHub history for details.
#

set -e

DEFAULT_VERSIONS="osd-2.0.0,osd-2.1.0,osd-2.2.0,osd-2.3.0,osd-2.4.0,osd-2.5.0,osd-2.6.0,osd-2.7.0,osd-2.8.0,osd-2.9.0"

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
    echo -e "-b BIND_ADDRESS\t, defaults to localhost | 127.0.0.1, can be changed to any IP or domain name for the cluster location."
    echo -e "-p BIND_PORT\t, defaults to 9200 or 5601 depends on OpenSearch or Dashboards, can be changed to any port for the cluster location."
    echo -e "-s SECURITY_ENABLED\t(true | false), defaults to true. Specify the OpenSearch/Dashboards have security enabled or not."
    echo -e "-c CREDENTIAL\t(usename:password), no defaults, effective when SECURITY_ENABLED=true."
    echo -e "-h\tPrint this message."
    echo "--------------------------------------------------------------------------"
}

while getopts ":h:b:p:s:c:o:d:" arg; do
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
[ -z "$CI" ] && CI=1
[ -z "$BWC_VERSIONS" ] && BWC_VERSIONS=$DEFAULT_VERSIONS

# If no OpenSearch build was passed then this constructs the version
if [ -z "$OPENSEARCH" ]; then
    IFS='/' read -ra SLASH_ARR <<< "$DASHBOARDS"
    # Expected to be opensearch-x.y.z-platform-arch.tar.gz or opensearch-x.y.z-qualifier-platform-arch.tar.gz
    # Playground is supported path to enable sandbox testing
    [[ "$DASHBOARDS" == *"Playground"* ]] && TARBALL="${SLASH_ARR[14]}" || TARBALL="${SLASH_ARR[13]}"
    IFS='-' read -ra DASH_ARR <<< "$TARBALL"
    # If it contains a qualifer it will be length of 6
    [[ ${#DASH_ARR[@]} == 6 ]] && HAS_QUALIFER=true || HAS_QUALIFER=false
    # Expected to be arch.tar.gz
    [ $HAS_QUALIFER == true ] && DOTS="${DASH_ARR[5]}" || DOTS="${DASH_ARR[4]}"
    IFS='.' read -ra DOTS_ARR <<< "$DOTS"

    [ $HAS_QUALIFER == true ] && VERSION="${DASH_ARR[2]}-${DASH_ARR[3]}" || VERSION="${DASH_ARR[2]}"
    [ $HAS_QUALIFER == true ] && PLATFORM="${DASH_ARR[4]}" || PLATFORM="${DASH_ARR[3]}"
    ARCH="${DOTS_ARR[0]}"

    OPENSEARCH="https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/$VERSION/latest/$PLATFORM/$ARCH/tar/dist/opensearch/opensearch-$VERSION-$PLATFORM-$ARCH.tar.gz"
fi

source scripts/bwctest_osd.sh -b $BIND_ADDRESS -p $BIND_PORT -s $SECURITY_ENABLED -c $CREDENTIAL -o $OPENSEARCH -d $DASHBOARDS -v $BWC_VERSIONS
