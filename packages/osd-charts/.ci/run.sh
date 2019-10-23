#!/usr/bin/env bash

set -e

# move to elastic-charts root
cd "$(dirname "$0")/.."

dir="$(pwd)"
cacheDir="${CACHE_DIR:-"$HOME/.elastic-charts"}"

RED='\033[0;31m'
C_RESET='\033[0m' # Reset color

###
### Since the Jenkins logging output collector doesn't look like a TTY
### Node/Chalk and other color libs disable their color output. But Jenkins
### can handle color fine, so this forces https://github.com/chalk/supports-color
### to enable color support in Chalk and other related modules.
###
export FORCE_COLOR=1

###
### download node
###
UNAME=$(uname)
OS="linux"
if [[ "$UNAME" = *"MINGW64_NT"* ]]; then
  OS="win"
fi
echo " -- Running on OS: $OS"

nodeVersion="$(cat $dir/.nvmrc)"
nodeDir="$cacheDir/node/$nodeVersion"

if [[ "$OS" == "win" ]]; then
  nodeBin="$HOME/node"
  nodeUrl="https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-win-x64.zip"
else
  nodeBin="$nodeDir/bin"
  nodeUrl="https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-linux-x64.tar.gz"
fi

echo " -- node: version=v${nodeVersion} dir=$nodeDir"

echo " -- setting up node.js"
if [ -x "$nodeBin/node" ] && [ "$($nodeBin/node --version)" == "v$nodeVersion" ]; then
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
    curl --silent -o $nodePkg $nodeUrl
    unzip -qo $nodePkg -d $nodeDir
    mv "${nodePkg%.*}" "$nodeBin"
  else
    curl --silent "$nodeUrl" | tar -xz -C "$nodeDir" --strip-components=1
  fi
fi

###
### "install" node into this shell
###
export PATH="$nodeBin:$PATH"

###
### downloading yarn
###
yarnVersion="$(node -e "console.log(String(require('./package.json').engines.yarn || '').replace(/^[^\d]+/,''))")"
npm install -g yarn@^${yarnVersion}

###
### setup yarn offline cache
###
yarn config set yarn-offline-mirror "$cacheDir/yarn-offline-cache"

###
### "install" yarn into this shell
###
yarnGlobalDir="$(yarn global bin)"
export PATH="$PATH:$yarnGlobalDir"

###
### install dependencies
###
echo " -- installing dependencies"
yarn install --frozen-lockfile

###
### install codecov dependencies
###
echo " -- installing codecov dependencies"
yarn add codecov --prefer-offline --frozen-lockfile

###
### building
###
echo " -- building"
yarn build

###
### run linter
###
echo " -- run linter"
yarn lint

###
### timezone specific testing
###
echo " -- tz testing"
yarn test:tz --ci

###
### testing
###
echo " -- testing"
yarn test --coverage --ci

###
### upload code coverage
###
echo " -- upload code coverage"
./node_modules/.bin/codecov

###
### visual testing
###
echo " -- visual testing"
yarn jest:integration --ci
