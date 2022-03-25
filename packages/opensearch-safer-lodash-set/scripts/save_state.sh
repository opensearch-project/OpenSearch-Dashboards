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

set -e

source ./scripts/_get_lodash.sh

modified_lodash_files=(_baseSet.js)

# Create fresh patch files for each of the modified files
for file in "${modified_lodash_files[@]}"
do
  diff ".tmp/node_modules/lodash/$file" "lodash/$file" > "scripts/patches/$file.patch" || true
done

echo "State updated!"
