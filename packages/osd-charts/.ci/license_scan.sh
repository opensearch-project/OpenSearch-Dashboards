#!/usr/bin/env bash

###
### global setup
###
source .ci/global_setup.sh

###
### run FOSSA license check
###
fossa analyze --output
