#!/usr/bin/env bash

###
### global setup
###
source .ci/global_setup.sh

###
### install codecov dependencies
###
# temporarily disabled
# echo " -- installing codecov dependencies"
# yarn add codecov --prefer-offline --frozen-lockfile

###
### timezone specific testing
###
echo " -- tz testing"
yarn test:tz --ci

###
### testing
###
echo " -- testing"
# yarn test --coverage --ci
yarn test --ci

###
### upload code coverage
###
# temporarily disabled
# echo " -- upload code coverage"
# ./node_modules/.bin/codecov
