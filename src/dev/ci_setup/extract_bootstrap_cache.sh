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

targetBranch="${PR_TARGET_BRANCH:-$GIT_BRANCH}"
bootstrapCache="$HOME/.opensearch_dashboards/bootstrap_cache/$targetBranch.tar"

###
### Extract the bootstrap cache that we create in the packer_cache.sh script
###
if [ -f "$bootstrapCache" ]; then
  echo "extracting bootstrap_cache from $bootstrapCache";
  tar -xf "$bootstrapCache";
else
  branchBootstrapCache="$HOME/.opensearch_dashboards/bootstrap_cache/$(jq -r .branch package.json).tar"

  if [ -f "$branchBootstrapCache" ]; then
    echo "extracting bootstrap_cache from $branchBootstrapCache";
    tar -xf "$branchBootstrapCache";
  else
    echo ""
    echo ""
    echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~";
    echo "            bootstrap_cache missing";
    echo "            looked for '$bootstrapCache'";
    echo "            and '$branchBootstrapCache'";
    echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~";
    echo ""
    echo ""
  fi
fi
