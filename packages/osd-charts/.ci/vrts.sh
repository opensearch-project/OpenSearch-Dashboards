#!/usr/bin/env bash

###
### global setup
###
source .ci/global_setup.sh

###
### visual testing
###
echo " -- visual testing"
yarn test:integration --ci
