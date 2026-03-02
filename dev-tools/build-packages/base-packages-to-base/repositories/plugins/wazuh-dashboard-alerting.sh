# Clone the Wazuh Security Analytics plugin
source /usr/local/lib/wazuh/run-with-retry.sh

cd /home/node/app/plugins
run_with_retry git clone --depth 1 --branch ${WAZUH_DASHBOARD_ALERTING_BRANCH} https://github.com/wazuh/wazuh-dashboard-alerting.git
cd wazuh-dashboard-alerting
run_with_retry yarn install
echo "Building Wazuh Alerting plugin"
run_with_retry yarn build
echo "Copying Wazuh Alerting plugin"
mkdir /home/node/packages/wazuh-dashboard-alerting
cp -r build/* /home/node/packages/wazuh-dashboard-alerting
