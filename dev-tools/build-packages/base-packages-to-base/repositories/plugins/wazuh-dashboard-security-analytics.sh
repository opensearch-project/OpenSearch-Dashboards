# Clone the Wazuh Security Analytics plugin
source /usr/local/lib/wazuh/run-with-retry.sh

cd /home/node/app/plugins
run_with_retry git clone --depth 1 --branch ${WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH} https://github.com/wazuh/wazuh-dashboard-security-analytics.git
cd wazuh-dashboard-security-analytics
run_with_retry yarn install
echo "Building Wazuh Security Analytics plugin"
run_with_retry yarn build
echo "Copying Wazuh Security Analytics plugin"
mkdir /home/node/packages/wazuh-security-analytics-plugin
cp -r build/* /home/node/packages/wazuh-security-analytics-plugin
