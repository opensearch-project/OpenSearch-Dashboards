#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

function run_generate_data_spec() {
  echo "[ Generating test data ]"
  cd "$TEST_DIR"
  [ "$CI" == '1' ] && cypress_args="--browser chromium" || cypress_args=""
  SPEC_FILE="$TEST_DIR/cypress/integration/$DASHBOARDS_TYPE/helpers/generate_data.js"
  env NO_COLOR=1 npx cypress run $cypress_args --headless --spec $SPEC_FILE || true
}

function archive_data() {
  echo "[ Archiving test data. Beep boo-boo, boo-boo bop ]"
  PACKAGE_VERSION=$(get_dashboards_package_version)
  cd "$OPENSEARCH_DIR" && tar -zcvf "osd-$PACKAGE_VERSION.tar.gz" data
  cp "osd-$PACKAGE_VERSION.tar.gz" "$CWD/cypress/test-data/$DASHBOARDS_TYPE"
  echo "[ Archive complete. Location: $CWD/cypress/test-data/$DASHBOARDS_TYPE/osd-$PACKAGE_VERSION.tar.gz' ]"
}