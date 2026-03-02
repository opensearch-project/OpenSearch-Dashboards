# Usage:
# docker build \
#         --build-arg NODE_VERSION=22.22.0 \
#         --build-arg WAZUH_DASHBOARD_BRANCH=main \
#         --build-arg WAZUH_DASHBOARD_SECURITY_BRANCH=main \
#         --build-arg WAZUH_DASHBOARD_PLUGINS_BRANCH=main \
#         --build-arg WAZUH_DASHBOARD_REPORTING_BRANCH=main \
#         --build-arg WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH=main \
#         --build-arg WAZUH_DASHBOARD_ALERTING_BRANCH=main \
#         --build-arg WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH=main \
#         --build-arg ARCHITECTURE=arm \
#         -t wazuh-packages-to-base:5.0.0 \
#         -f base-packages.Dockerfile .

ARG NODE_VERSION=22.22.0
FROM node:${NODE_VERSION} AS base
ARG ARCHITECTURE='amd'
ARG WAZUH_DASHBOARD_BRANCH
ARG WAZUH_DASHBOARD_SECURITY_BRANCH
ARG WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH
ARG WAZUH_DASHBOARD_PLUGINS_BRANCH
ARG WAZUH_DASHBOARD_REPORTING_BRANCH
ARG WAZUH_DASHBOARD_ALERTING_BRANCH
ARG WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH
ENV OPENSEARCH_DASHBOARDS_VERSION=3.5.0
ENV ENV_ARCHITECTURE=${ARCHITECTURE}
USER root
RUN apt-get update && apt-get install -y jq && mkdir -p /usr/local/lib/wazuh
ADD ./common/run-with-retry.sh /usr/local/lib/wazuh/run-with-retry.sh
RUN chown -R node:node /usr/local/lib/wazuh
USER node
ADD ./base-packages-to-base/clone-plugins.sh /home/node/clone-plugins.sh
ADD ./base-packages-to-base/repositories/wazuh-dashboard.sh /home/node/repositories/wazuh-dashboard.sh
ADD ./base-packages-to-base/repositories/plugins/wazuh-dashboard-security-analytics.sh /home/node/repositories/plugins/wazuh-dashboard-security-analytics.sh
ADD ./base-packages-to-base/repositories/plugins/wazuh-security-dashboards-plugin.sh /home/node/repositories/plugins/wazuh-security-dashboards-plugin.sh
ADD ./base-packages-to-base/repositories/plugins/wazuh-dashboard-reporting.sh /home/node/repositories/plugins/wazuh-dashboard-reporting.sh
ADD ./base-packages-to-base/repositories/plugins/wazuh-dashboard-plugins.sh /home/node/repositories/plugins/wazuh-dashboard-plugins.sh
ADD ./base-packages-to-base/repositories/plugins/wazuh-dashboard-alerting.sh /home/node/repositories/plugins/wazuh-dashboard-alerting.sh
ADD ./base-packages-to-base/repositories/plugins/wazuh-dashboard-notifications.sh /home/node/repositories/plugins/wazuh-dashboard-notifications.sh
RUN bash /home/node/clone-plugins.sh

FROM node:${NODE_VERSION}
USER node
COPY --chown=node:node --from=base /home/node/packages /home/node/packages
WORKDIR /home/node/packages
