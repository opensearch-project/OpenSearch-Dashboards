plugins=$(cat /home/node/plugins)
base_path_plugins="/home/node/kbn/plugins"
category_explore="id: 'explore',label: 'Explore',order: 100,euiIconType: 'search',"
category_dashboard_management='{id:"management",label:"Indexer management",order:5e3,euiIconType:"managementApp"}'
old_category_default="DEFAULT_APP_CATEGORIES\.management,"
old_category_object="id: 'opensearch',/{
    N
    N
    s/id: 'opensearch',\n\s*label: 'OpenSearch Plugins',\n\s*order: 2000,"
for plugin in $plugins; do
  cd $base_path_plugins
  if [[ $plugin =~ wazuh* ]]; then
    # Clone the Wazuh security plugin
    if [[ $plugin == "wazuh-security-dashboards-plugin" ]]; then
      git clone --depth 1 --branch ${WAZUH_DASHBOARD_SECURITY_BRANCH} https://github.com/wazuh/$plugin.git
    fi
    # Clone the Wazuh dashboards reporting plugin
    if [[ $plugin == "wazuh-dashboard-reporting" ]]; then
      git clone --depth 1 --branch ${WAZUH_DASHBOARD_REPORTING_BRANCH} https://github.com/wazuh/$plugin.git
    fi
    # Clone the Wazuh dashboard security analytics plugin
    if [[ $plugin == "wazuh-dashboard-security-analytics" ]]; then
      git clone --depth 1 --branch ${WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH} https://github.com/wazuh/$plugin.git
    fi
    # Clone the Wazuh dashboard notifications plugin
    if [[ $plugin == "wazuh-dashboard-notifications" ]]; then
      git clone --depth 1 --branch ${WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH} https://github.com/wazuh/$plugin.git
    fi
    # Clone the Wazuh dashboard alerting plugin
    if [[ $plugin == "wazuh-dashboard-alerting" ]]; then
      git clone --depth 1 --branch ${WAZUH_DASHBOARD_ALERTING_BRANCH} https://github.com/wazuh/$plugin.git
    fi
    # Clone the Wazuh dashboards plugins and move the plugins to the plugins folder
    if [[ $plugin == "wazuh-dashboard-plugins" ]]; then
      git clone --depth 1 --branch ${WAZUH_DASHBOARD_PLUGINS_BRANCH} https://github.com/wazuh/$plugin.git
      wazuh_dashboard_plugins=$(ls $base_path_plugins/$plugin/plugins)
      mv $plugin/plugins/* ./
      for wazuh_dashboard_plugin in $wazuh_dashboard_plugins; do
        cd $base_path_plugins/$wazuh_dashboard_plugin
        GIT_REF="${WAZUH_DASHBOARD_PLUGINS_BRANCH}" yarn install
      done
      cd $base_path_plugins
      rm -rf $plugin
    fi

  else
    git clone --depth 1 --branch ${OPENSEARCH_DASHBOARD_VERSION} https://github.com/opensearch-project/$plugin.git
    cd $base_path_plugins/$plugin/public

    # Notification plugin: Modify the plugin.ts file to add the Explore category
    if [[ $plugin == "dashboards-notifications" ]]; then
      sed -i -e "s/${old_category_default}/{${category_explore}},/g" ./plugin.ts
    fi

    # Alerting plugin: Modify the plugin.ts file to add the Explore category
    if [[ $plugin == "alerting-dashboards-plugin" ]]; then
      sed -i -e "/${old_category_object}/${category_explore}/}" plugin.tsx
    fi

    # Maps plugin: Modify the plugin.ts file to add the Explore category
    if [[ $plugin == "dashboards-maps" ]]; then
      sed -i -e "/${old_category_object}/${category_explore}/}" plugin.tsx
    fi

    # Index Management plugin: Modify the plugin.ts file to add the Explore category
    if [[ $plugin == "index-management-dashboards-plugin" ]]; then
      sed -i -e "s/${old_category_default}/${category_dashboard_management},/g" ./plugin.ts
    fi

  fi
  if [[ $plugin != "wazuh-dashboard-plugins" ]]; then
    cd $base_path_plugins/$plugin
    yarn install
  fi
done
