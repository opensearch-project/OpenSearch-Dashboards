#!/usr/bin/env bash
set -e

export TZ=UTC
export JEST_PUPPETEER_CONFIG=integration/jest_puppeteer.config.js
FILE=integration/tmp/examples.json

if [[ -n "${LOCAL_VRT_SERVER}" ]] && [[ ! -f "$FILE" ]]; then
  echo
  echo -e "\033[31m$FILE does not exist"
  echo -e "Please run yarn test:integration:generate first"
  echo
  exit 1
fi


rm -rf ./integration/tests/__image_snapshots__/__diff_output__

jest --verbose --rootDir=integration -c=integration/jest.config.js --runInBand "$@"
