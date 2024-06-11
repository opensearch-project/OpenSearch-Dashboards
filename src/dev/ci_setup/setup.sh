#!/usr/bin/env bash

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

source src/dev/ci_setup/setup_env.sh true

echo " -- OPENSEARCH_DASHBOARDS_DIR='$OPENSEARCH_DASHBOARDS_DIR'"
echo " -- PARENT_DIR='$PARENT_DIR'"
echo " -- OPENSEARCH_DASHBOARDS_PKG_BRANCH='$OPENSEARCH_DASHBOARDS_PKG_BRANCH'"
echo " -- TEST_OPENSEARCH_SNAPSHOT_VERSION='$TEST_OPENSEARCH_SNAPSHOT_VERSION'"

###
### install dependencies
###
echo " -- installing node.js dependencies"
yarn osd bootstrap --prefer-offline

###
### Download opensearch snapshots
###
echo " -- downloading opensearch snapshot"
scripts/use_node scripts/opensearch snapshot --download-only;
scripts/use_node scripts/opensearch snapshot --license=oss --download-only;


###
### verify no git modifications
###
GIT_CHANGES="$(git ls-files --modified)"
if [ "$GIT_CHANGES" ]; then
  echo -e "\n${RED}ERROR: 'yarn osd bootstrap' caused changes to the following files:${C_RESET}\n"
  echo -e "$GIT_CHANGES\n"
  exit 1
fi

###
### rebuild osd-pm distributable to ensure it's not out of date
###
echo " -- building osd-pm distributable"
yarn osd run build -i @osd/pm

###
### verify no git modifications
###
GIT_CHANGES="$(git ls-files --modified)"
if [ "$GIT_CHANGES" ]; then
  echo -e "\n${RED}ERROR: 'yarn osd run build -i @osd/pm' caused changes to the following files:${C_RESET}\n"
  echo -e "$GIT_CHANGES\n"
  exit 1
fi

###
### rebuild plugin list to ensure it's not out of date
###
echo " -- building plugin list docs"
scripts/use_node scripts/build_plugin_list_docs

###
### verify no git modifications
###
GIT_CHANGES="$(git ls-files --modified)"
if [ "$GIT_CHANGES" ]; then
  echo -e "\n${RED}ERROR: 'node scripts/build_plugin_list_docs' caused changes to the following files:${C_RESET}\n"
  echo -e "$GIT_CHANGES\n"
  exit 1
fi
