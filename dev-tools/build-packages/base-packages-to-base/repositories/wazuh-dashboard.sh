source /usr/local/lib/wazuh/run-with-retry.sh

run_with_retry git clone --depth 1 --branch ${WAZUH_DASHBOARD_BRANCH} https://github.com/wazuh/wazuh-dashboard.git /home/node/app
cd /home/node/app
run_with_retry yarn osd bootstrap --production
echo "Building Wazuh dashboard"
if [ $ENV_ARCHITECTURE == "arm" ]; then
  run_with_retry yarn build-platform --linux-arm --skip-os-packages --release
else
  run_with_retry yarn build-platform --linux --skip-os-packages --release
fi
mkdir /home/node/packages/wazuh-dashboard
echo "Copying Wazuh dashboard"
ls -la /home/node/app/target
cp -r /home/node/app/target/*.tar.gz /home/node/packages/wazuh-dashboard
