#!/usr/bin/env bash

source src/dev/ci_setup/setup_env.sh

if [[ ! "$TASK_QUEUE_PROCESS_ID" ]]; then
  ./test/scripts/jenkins_build_plugins.sh
fi

# doesn't persist, also set in OpenSearchDashboardsPipeline.groovy
export OSD_NP_PLUGINS_BUILT=true

echo " -> Ensuring all functional tests are in a ciGroup"
yarn run grunt functionalTests:ensureAllTestsInCiGroup;

echo " -> building and extracting OSS OpenSearch Dashboardsdistributable for use in functional tests"
node scripts/build --debug --oss

mkdir -p "$WORKSPACE/opensearch-dashboards-build-oss"
cp -pR build/oss/opensearch-dashboards-*-SNAPSHOT-linux-x86_64/. $WORKSPACE/opensearch-dashboards-build-oss/
