#!/usr/bin/env bash

###
### global setup
###
source .ci/global_setup.sh

###
### install codecov dependencies
###
echo " -- installing codecov dependencies"
yarn add codecov --prefer-offline --frozen-lockfile

###
### timezone specific testing
###
echo " -- tz testing"
yarn test:tz --ci

###
### testing
###
echo " -- testing"
yarn test --coverage --ci

###
### upload code coverage
###
echo " -- upload code coverage"
./node_modules/.bin/codecov
