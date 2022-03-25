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

# Elasticsearch B.V licenses this file to you under the MIT License.
# See `packages/elastic-safer-lodash-set/LICENSE` for more information.

clean_up () {
  exit_code=$?
  rm -fr .tmp
  exit $exit_code
}
trap clean_up EXIT

# Get a temporary copy of the latest v4 lodash
rm -fr .tmp
npm install --no-fund --ignore-scripts --no-audit --loglevel error --prefix ./.tmp lodash@4 > /dev/null
