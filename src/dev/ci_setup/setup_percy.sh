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

###
### skip chomium download, use the system chrome install
###
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH="$(command -v google-chrome-stable)"
export PUPPETEER_EXECUTABLE_PATH

###
### Set Percy parallel build support environment vars
###
eval "$(./scripts/use_node ./src/dev/ci_setup/get_percy_env)"
echo " -- PERCY_PARALLEL_NONCE='$PERCY_PARALLEL_NONCE'"
echo " -- PERCY_PARALLEL_TOTAL='$PERCY_PARALLEL_TOTAL'"
echo " -- PERCY_BRANCH='$PERCY_BRANCH'"
echo " -- PERCY_TARGET_BRANCH='$PERCY_TARGET_BRANCH'"
