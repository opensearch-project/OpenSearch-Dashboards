#!/bin/bash
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
  base_path_plugins="/home/node/kbn/plugins"
  plugins=$(ls $base_path_plugins)
  for plugin in $plugins; do
    echo "Checking if $plugin has node_modules"
    if [ ! -d "$base_path_plugins/$plugin/node_modules" ]; then
      cd $base_path_plugins/$plugin
      echo "Installing dependencies for $plugin"
      yarn install
    fi
  done
  cd /home/node/kbn
  yarn start --no-base-path
  tail -f /dev/null
fi

exec "$@"
