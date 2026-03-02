# Clone the Wazuh security plugin
source /usr/local/lib/wazuh/run-with-retry.sh

cd /home/node/app/plugins
run_with_retry git clone --depth 1 --branch ${WAZUH_DASHBOARD_SECURITY_BRANCH} https://github.com/wazuh/wazuh-security-dashboards-plugin.git
cd wazuh-security-dashboards-plugin
run_with_retry yarn install
echo "Building Wazuh security plugin"
run_with_retry yarn build
echo "Copying Wazuh security plugin"
mkdir /home/node/packages/wazuh-security-dashboards-plugin
cp -r build/* /home/node/packages/wazuh-security-dashboards-plugin
