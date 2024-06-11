#!/bin/bash
echo $REPO_URL
git remote set-url origin $REPO_URL
git fetch
tail -f /dev/null
