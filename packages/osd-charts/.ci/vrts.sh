#!/usr/bin/env bash

###
### global setup
###
source .ci/global_setup.sh

VRTS_FILES=$1
###
### visual testing
###
echo " -- visual testing"
yarn test:integration:generate
yarn test:integration --ci $VRTS_FILES
