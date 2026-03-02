# Clone the Wazuh Security Analytics plugin
source /usr/local/lib/wazuh/run-with-retry.sh

cd /home/node/app/plugins
run_with_retry git clone --depth 1 --branch ${WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH} https://github.com/wazuh/wazuh-dashboard-notifications.git
cd wazuh-dashboard-notifications
run_with_retry yarn install
echo "Building Wazuh Notifications plugin"
run_with_retry yarn build
echo "Copying Wazuh Notifications plugin"
mkdir /home/node/packages/wazuh-dashboard-notifications
cp -r build/* /home/node/packages/wazuh-dashboard-notifications
