#!/usr/bin/env bash

set -e

function post_work() {
  set +e
  if [[ -z "$REMOVE_OPENSEARCH_DASHBOARDS_INSTALL_DIR" && -z "$OPENSEARCH_DASHBOARDS_INSTALL_DIR" && -d "$OPENSEARCH_DASHBOARDS_INSTALL_DIR" ]]; then
    rm -rf "$REMOVE_OPENSEARCH_DASHBOARDS_INSTALL_DIR"
  fi
}

trap 'post_work' EXIT

export TEST_BROWSER_HEADLESS=1

source src/dev/ci_setup/setup_env.sh

# For parallel workspaces, we should copy the .opensearch directory from the root, because it should already have downloaded snapshots in it
# This isn't part of jenkins_setup_parallel_workspace.sh just because not all tasks require OpenSearch
if [[ ! -d .opensearch && -d "$WORKSPACE/opensearch-dashboards/.opensearch" ]]; then
  cp -R $WORKSPACE/opensearch-dashboards/.opensearch ./
fi
