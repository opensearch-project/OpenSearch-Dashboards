source /usr/local/lib/wazuh/run-with-retry.sh

base_path_plugins="/home/node/app/plugins"
cd $base_path_plugins
run_with_retry git clone --depth 1 --branch ${WAZUH_DASHBOARD_PLUGINS_BRANCH} https://github.com/wazuh/wazuh-dashboard-plugins.git
wazuh_dashboard_plugins=$(ls $base_path_plugins/wazuh-dashboard-plugins/plugins)
mv wazuh-dashboard-plugins/plugins/* ./
mkdir /home/node/packages/wazuh-dashboard-plugins
for wazuh_dashboard_plugin in $wazuh_dashboard_plugins; do
  cd $base_path_plugins/$wazuh_dashboard_plugin
  run_with_retry env GIT_REF="${WAZUH_DASHBOARD_PLUGINS_BRANCH}" yarn install
  echo "Building $wazuh_dashboard_plugin"
  run_with_retry yarn build
  echo "Copying $wazuh_dashboard_plugin"
  package_name=$(jq -r '.id' ./opensearch_dashboards.json)
  cp $base_path_plugins/$wazuh_dashboard_plugin/build/$package_name-$OPENSEARCH_DASHBOARDS_VERSION.zip /home/node/packages/wazuh-dashboard-plugins/$package_name-$OPENSEARCH_DASHBOARDS_VERSION.zip
done
cd $base_path_plugins
rm -rf wazuh-dashboard-plugins
