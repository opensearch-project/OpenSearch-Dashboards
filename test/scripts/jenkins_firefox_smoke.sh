#!/usr/bin/env bash

source test/scripts/jenkins_test_setup_oss.sh

checks-reporter-with-killswitch "Firefox smoke test" \
  node scripts/functional_tests \
    --bail --debug \
    --opensearch-dashboards-install-dir "$OPENSEARCH_DASHBOARDS_INSTALL_DIR" \
    --include-tag "includeFirefox" \
    --config test/functional/config.firefox.js;
