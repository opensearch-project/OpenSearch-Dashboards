#!/usr/bin/env bash

###
### global setup
###
source global_setup.sh

###
### visual testing
###
echo " -- visual testing"
yarn test:integration --ci
