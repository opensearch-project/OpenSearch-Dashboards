#!/bin/bash

#
# SPDX-License-Identifier: Apache-2.0
#
# The OpenSearch Contributors require contributions made to
# this file be licensed under the Apache-2.0 license or a
# compatible open source license.
#
# Any modifications Copyright OpenSearch Contributors. See
# GitHub history for details.
#

set -e

function checkout_sibling {
  project=$1
  targetDir=$2
  useExistingParamName=$3
  useExisting="$(eval "echo "\$$useExistingParamName"")"
  repoAddress="https://github.com/"

  if [ -z ${useExisting:+x} ]; then
    if [ -d "$targetDir" ]; then
      echo "I expected a clean workspace but an '${project}' sibling directory already exists in [$WORKSPACE]!"
      echo
      echo "Either define '${useExistingParamName}' or remove the existing '${project}' sibling."
      exit 1
    fi

    # read by clone_target_is_valid, and checkout_clone_target populated by pick_clone_target
    cloneAuthor=""
    cloneBranch=""

    function clone_target_is_valid {

      echo " -> checking for '${cloneBranch}' branch at ${cloneAuthor}/${project}"
      if [[ -n "$(git ls-remote --heads "${repoAddress}${cloneAuthor}/${project}.git" ${cloneBranch} 2>/dev/null)" ]]; then
        return 0
      else
        return 1
      fi
    }

    function pick_clone_target {
      echo "To develop OpenSearch Dashboards features against a specific branch of ${project} and being able to"
      echo "test that feature also on CI, the CI is trying to find branches on ${project} with the same name as"
      echo "the OpenSearch Dashboards branch (first on your fork and then upstream) before building from main."
      echo "picking which branch of ${project} to clone:"
      if [[ -n "$PR_AUTHOR" && -n "$PR_SOURCE_BRANCH" ]]; then
        cloneAuthor="$PR_AUTHOR"
        cloneBranch="$PR_SOURCE_BRANCH"
        if clone_target_is_valid ; then
          return 0
        fi
      fi

      cloneAuthor="elastic"
      cloneBranch="$GIT_BRANCH"
      if clone_target_is_valid ; then
        return 0
      fi

      cloneBranch="${PR_TARGET_BRANCH:-$OPENSEARCH_DASHBOARDS_PKG_BRANCH}"
      if clone_target_is_valid ; then
        return 0
      fi

      cloneBranch="$OPENSEARCH_DASHBOARDS_PKG_BRANCH"
      if clone_target_is_valid; then
        return 0
      fi

      echo "failed to find a valid branch to clone"
      return 1
    }

    function checkout_clone_target {
      pick_clone_target

      if [[ "$cloneAuthor/$cloneBranch" != "elastic/$OPENSEARCH_DASHBOARDS_PKG_BRANCH" ]]; then
        echo " -> Setting TEST_OPENSEARCH_FROM=source so that OpenSearch in tests will be built from $cloneAuthor/$cloneBranch"
        export TEST_OPENSEARCH_FROM=source
      fi

      echo " -> checking out '${cloneBranch}' branch from ${cloneAuthor}/${project}..."
      git clone -b "$cloneBranch" "${repoAddress}${cloneAuthor}/${project}.git" "$targetDir" --depth=1
      echo " -> checked out ${project} revision: $(git -C "${targetDir}" rev-parse HEAD)"
      echo
    }

    checkout_clone_target
  else
    if [ -d "$targetDir" ]; then
      echo "Using existing '${project}' checkout"
    else
      echo "You have defined '${useExistingParamName}' but no existing ${targetDir} directory exists!"
      exit 2
    fi
  fi
}

checkout_sibling "opensearch" "${WORKSPACE}/opensearch" "USE_EXISTING_OPENSEARCH"
export TEST_OPENSEARCH_FROM=${TEST_OPENSEARCH_FROM:-snapshot}

# Set the JAVA_HOME based on the Java property file in the OpenSearch repo
# This assumes the naming convention used on CI (ex: ~/.java/java10)
OPENSEARCH_DIR="$WORKSPACE/opensearch"
OPENSEARCH_JAVA_PROP_PATH=$OPENSEARCH_DIR/.ci/java-versions.properties


if [ ! -f "$OPENSEARCH_JAVA_PROP_PATH" ]; then
  echo "Unable to set JAVA_HOME, $OPENSEARCH_JAVA_PROP_PATH does not exist"
  exit 1
fi

# While sourcing the property file would currently work, we want
# to support the case where whitespace surrounds the equals.
# This has the added benefit of explicitly exporting property values
OPENSEARCH_BUILD_JAVA="$(grep "^OPENSEARCH_BUILD_JAVA" "$OPENSEARCH_JAVA_PROP_PATH" | cut -d'=' -f2 | tr -d '[:space:]')"
export OPENSEARCH_BUILD_JAVA

if [ -z "$OPENSEARCH_BUILD_JAVA" ]; then
  echo "Unable to set JAVA_HOME, OPENSEARCH_BUILD_JAVA not present in $OPENSEARCH_JAVA_PROP_PATH"
  exit 1
fi

echo "Setting JAVA_HOME=$HOME/.java/$OPENSEARCH_BUILD_JAVA"
export JAVA_HOME=$HOME/.java/$OPENSEARCH_BUILD_JAVA
