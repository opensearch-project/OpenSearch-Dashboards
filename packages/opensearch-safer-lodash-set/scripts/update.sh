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

all_files=$(cd lodash && ls)
modified_lodash_files=(_baseSet.js)

# Get fresh copies of all the files that was originally copied from lodash,
# expect the ones in the allowlist
for file in $all_files
do
  if [[ ! "${modified_lodash_files[@]}" =~ "${file}" ]]
  then
    cat scripts/license-header.txt > "lodash/$file"
    printf "/* eslint-disable */\n\n" >> "lodash/$file"
    cat ".tmp/node_modules/lodash/$file" >> "lodash/$file"
  fi
done

# Check if there's changes to the patched files
for file in "${modified_lodash_files[@]}"
do
  diff ".tmp/node_modules/lodash/$file" "lodash/$file" > ".tmp/$file.patch" || true
  if [[ $(diff ".tmp/$file.patch" "scripts/patches/$file.patch") ]]; then
    echo "WARNING: The modified file $file have changed in a newer version of lodash, but was not updated:"
    echo "------------------------------------------------------------------------"
    diff ".tmp/$file.patch" "scripts/patches/$file.patch" || true
    echo "------------------------------------------------------------------------"
  fi
done

echo "Update complete!"
