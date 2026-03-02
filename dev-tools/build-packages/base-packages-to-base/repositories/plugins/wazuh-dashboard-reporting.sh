# Clone the Wazuh security plugin
source /usr/local/lib/wazuh/run-with-retry.sh

cd /home/node/app/plugins
run_with_retry git clone --depth 1 --branch ${WAZUH_DASHBOARD_REPORTING_BRANCH} https://github.com/wazuh/wazuh-dashboard-reporting.git
cd wazuh-dashboard-reporting
run_with_retry yarn install
echo "Building Wazuh reporting plugin"
run_with_retry yarn build
echo "Copying Wazuh reporting plugin"
mkdir /home/node/packages/wazuh-dashboard-reporting
cp -r build/* /home/node/packages/wazuh-dashboard-reporting
