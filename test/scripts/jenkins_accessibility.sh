#!/usr/bin/env bash

source test/scripts/jenkins_test_setup_oss.sh

checks-reporter-with-killswitch "OpenSearch Dashboardsaccessibility tests" \
  node scripts/functional_tests \
    --debug --bail \
    --opensearch-dashboards-install-dir "$OPENSEARCH_DASHBOARDS_INSTALL_DIR" \
    --config test/accessibility/config.ts;
