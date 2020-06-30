#!/usr/bin/env bash

###
### global setup
###
source .ci/global_setup.sh

VRT_FILES=$1
###
### visual testing
###
echo " -- visual testing"
yarn test:integration --ci
