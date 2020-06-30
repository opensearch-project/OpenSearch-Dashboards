#!/usr/bin/env bash

###
### global setup
###
source global_setup.sh

###
### run FOSSA license check
###
fossa analyze --output
