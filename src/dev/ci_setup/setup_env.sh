#!/usr/bin/env bash

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

if [[ "$CI_ENV_SETUP" ]]; then
  return 0
fi

installNode=$1

dir="$(pwd)"
cacheDir="$HOME/.opensearch_dashboards"

RED='\033[0;31m'
C_RESET='\033[0m' # Reset color

export NODE_OPTIONS="$NODE_OPTIONS --max-old-space-size=4096"

###
### Since the Jenkins logging output collector doesn't look like a TTY
### Node/Chalk and other color libs disable their color output. But Jenkins
### can handle color fine, so this forces https://github.com/chalk/supports-color
### to enable color support in Chalk and other related modules.
###
export FORCE_COLOR=1

###
### check that we seem to be in a OpenSearch Dashboards project
###
if [ -f "$dir/package.json" ] && [ -f "$dir/.node-version" ]; then
  echo "Setting up node.js and yarn in $dir"
else
  echo "${RED}src/dev/ci_setup/setup.sh must be run within a opensearch-dashboards repo${C_RESET}"
  exit 1
fi


export OPENSEARCH_DASHBOARDS_DIR="$dir"

parentDir="$(cd "$OPENSEARCH_DASHBOARDS_DIR/.."; pwd)"
export PARENT_DIR="$parentDir"

osdBranch="$(jq -r .branch "$OPENSEARCH_DASHBOARDS_DIR/package.json")"
export OPENSEARCH_DASHBOARDS_PKG_BRANCH="$osdBranch"

export WORKSPACE="${WORKSPACE:-$PARENT_DIR}"

###
### download node
###
nodeVersion="$(cat "$dir/.node-version")"
nodeDir="$cacheDir/node/$nodeVersion"
nodeBin="$nodeDir/bin"
classifier="x64.tar.gz"

UNAME=$(uname)
OS="linux"
if [[ "$UNAME" = *"MINGW64_NT"* ]]; then
  OS="win"
  nodeBin="$HOME/node"
  classifier="x64.zip"
elif [[ "$UNAME" == "Darwin" ]]; then
  OS="darwin"
fi
echo " -- Running on OS: $OS"

nodeUrl="https://us-central1-elastic-kibana-184716.cloudfunctions.net/kibana-ci-proxy-cache/dist/v$nodeVersion/node-v$nodeVersion-${OS}-${classifier}"

if [[ "$installNode" == "true" ]]; then
  echo " -- node: version=v${nodeVersion} dir=$nodeDir"

  echo " -- setting up node.js"
  if [ -x "$nodeBin/node" ] && [ "$("$nodeBin/node" --version)" == "v$nodeVersion" ]; then
    echo " -- reusing node.js install"
  else
    if [ -d "$nodeDir" ]; then
      echo " -- clearing previous node.js install"
      rm -rf "$nodeDir"
    fi

    echo " -- downloading node.js from $nodeUrl"
    mkdir -p "$nodeDir"
    if [[ "$OS" == "win" ]]; then
      nodePkg="$nodeDir/${nodeUrl##*/}"
      curl --silent -L -o "$nodePkg" "$nodeUrl"
      unzip -qo "$nodePkg" -d "$nodeDir"
      mv "${nodePkg%.*}" "$nodeBin"
    else
      curl --silent -L "$nodeUrl" | tar -xz -C "$nodeDir" --strip-components=1
    fi
  fi
fi

###
### "install" node into this shell
###
export PATH="$nodeBin:$PATH"

if [[ "$installNode" == "true" || ! $(which yarn) ]]; then
  ###
  ### downloading yarn
  ###
  yarnVersion="$(node -e "console.log(String(require('./package.json').engines.yarn || '').replace(/^[^\d]+/,''))")"
  npm install -g "yarn@^${yarnVersion}"
fi

###
### setup yarn offline cache
###
yarn config set yarn-offline-mirror "$cacheDir/yarn-offline-cache"

###
### "install" yarn into this shell
###
yarnGlobalDir="$(yarn global bin)"
export PATH="$PATH:$yarnGlobalDir"

# TODO: Find out if these are OSD's or if this entire file should be removed
# use a proxy to fetch chromedriver/geckodriver asset
export GECKODRIVER_CDNURL="https://us-central1-elastic-kibana-184716.cloudfunctions.net/kibana-ci-proxy-cache"
export CHROMEDRIVER_CDNURL="https://us-central1-elastic-kibana-184716.cloudfunctions.net/kibana-ci-proxy-cache"
export RE2_DOWNLOAD_MIRROR="https://us-central1-elastic-kibana-184716.cloudfunctions.net/kibana-ci-proxy-cache"
export CYPRESS_DOWNLOAD_MIRROR="https://us-central1-elastic-kibana-184716.cloudfunctions.net/kibana-ci-proxy-cache/cypress"

# This is mainly for release-manager builds, which run in an environment that doesn't have Chrome installed
if [[ "$(which google-chrome-stable)" || "$(which google-chrome)" ]]; then
  echo "Chrome detected, setting DETECT_CHROMEDRIVER_VERSION=true"
  export DETECT_CHROMEDRIVER_VERSION=true
  export CHROMEDRIVER_FORCE_DOWNLOAD=true
else
  echo "Chrome not detected, installing default chromedriver binary for the package version"
fi

source "$OPENSEARCH_DASHBOARDS_DIR/src/dev/ci_setup/load_env_keys.sh"

OPENSEARCH_DIR="$WORKSPACE/opensearch"
OPENSEARCH_JAVA_PROP_PATH=$OPENSEARCH_DIR/.ci/java-versions.properties

if [[ -d "$OPENSEARCH_DIR" && -f "$OPENSEARCH_JAVA_PROP_PATH" ]]; then
  OPENSEARCH_BUILD_JAVA="$(grep "^OPENSEARCH_BUILD_JAVA" "$OPENSEARCH_JAVA_PROP_PATH" | cut -d'=' -f2 | tr -d '[:space:]')"
  export OPENSEARCH_BUILD_JAVA

  if [ -z "$OPENSEARCH_BUILD_JAVA" ]; then
    echo "Unable to set JAVA_HOME, OPENSEARCH_BUILD_JAVA not present in $OPENSEARCH_JAVA_PROP_PATH"
    exit 1
  fi

  echo "Setting JAVA_HOME=$HOME/.java/$OPENSEARCH_BUILD_JAVA"
  export JAVA_HOME=$HOME/.java/$OPENSEARCH_BUILD_JAVA
fi

export CI_ENV_SETUP=true
