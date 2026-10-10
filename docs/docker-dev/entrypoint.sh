#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
echo $REPO_URL
git remote set-url origin $REPO_URL
git fetch
tail -f /dev/null
