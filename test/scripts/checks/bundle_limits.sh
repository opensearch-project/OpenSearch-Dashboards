#!/usr/bin/env bash

source src/dev/ci_setup/setup_env.sh

node scripts/build_opensearch_dashboards_platform_plugins --validate-limits
