#!/usr/bin/env bash

# This script runs OpenSearch Dashboards tests compatible with cloud.
#
# The cloud instance setup is done in the elastic/elastic-stack-testing framework,
# where the following environment variables are set pointing to the cloud instance.
#
# export TEST_OPENSEARCH_DASHBOARDS_HOSTNAME
# export TEST_OPENSEARCH_DASHBOARDS_PROTOCOL=
# export TEST_OPENSEARCH_DASHBOARDS_PORT=
# export TEST_OPENSEARCH_DASHBOARDS_USER=
# export TEST_OPENSEARCH_DASHBOARDS_PASS=
#
# export TEST_OPENSEARCH_HOSTNAME=
# export TEST_OPENSEARCH_PROTOCOL=
# export TEST_OPENSEARCH_PORT=
# export TEST_OPENSEARCH_USER=
# export TEST_OPENSEARCH_PASS=
#

set -e

source "$(dirname $0)/../../src/dev/ci_setup/setup.sh"

export TEST_BROWSER_HEADLESS=1
node scripts/functional_test_runner --debug --exclude-tag skipCloud $@
