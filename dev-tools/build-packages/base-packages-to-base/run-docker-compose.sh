#!/bin/bash

export WAZUH_DASHBOARD_PLUGINS_BRANCH=""
export WAZUH_DASHBOARD_BRANCH=""
export WAZUH_SECURITY_PLUGIN_BRANCH=""
export WAZUH_DASHBOARD_REPORTING_BRANCH=""
export WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH=""
export WAZUH_DASHBOARD_ALERTING_BRANCH=""
export WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH=""
export ARCHITECTURE="amd"
export NODE_VERSION="22.22.0"


run_docker_compose() {
  echo "WAZUH_DASHBOARD_PLUGINS_BRANCH: $WAZUH_DASHBOARD_PLUGINS_BRANCH"
  echo "WAZUH_SECURITY_PLUGIN_BRANCH: $WAZUH_SECURITY_PLUGIN_BRANCH"
  echo "WAZUH_DASHBOARD_BRANCH: $WAZUH_DASHBOARD_BRANCH"
  echo "WAZUH_DASHBOARD_REPORTING_BRANCH: $WAZUH_DASHBOARD_REPORTING_BRANCH"
  echo "WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH: $WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH"
  echo "WAZUH_DASHBOARD_ALERTING_BRANCH: $WAZUH_DASHBOARD_ALERTING_BRANCH"
  echo "WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH: $WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH"
  echo "ARCHITECTURE: $ARCHITECTURE"
  echo "NODE_VERSION: $NODE_VERSION"
  docker-compose up -d
}

help() {
  echo
  echo "Usage: $0 [OPTIONS]"
  echo "    -a, --app <url/path>          Set the Wazuh plugin branch."
  echo "    -b, --base <url/path>         Set the wazuh-dashboard branch."
  echo "    -s, --security <url/path>     Set the wazuh-security-dashboards-plugin branch."
  echo "    -sa, --securityAnalytics <url/path>   Set the wazuh-dashboard-security-analytics branch."
  echo "    -r, --reporting <url/path>    Set the wazuh-dashboard-reporting branch."
  echo "    --arm                         [Optional] Build for arm64 instead of x64."
  echo "    --node-version <version>      [Optional] Set the node version."
  echo "    -h, --help                    Show this help."
  echo
  exit $1
}

# -----------------------------------------------------------------------------

main() {
  while [ -n "${1}" ]; do
    case "${1}" in
    "-h" | "--help")
      help 0
      ;;
    "-a" | "--app")
      if [ -n "$2" ]; then
        WAZUH_DASHBOARD_PLUGINS_BRANCH="$2"
        shift 2
      else
        help 1
      fi
      ;;
    "-s" | "--security")
      if [ -n "${2}" ]; then
        WAZUH_SECURITY_PLUGIN_BRANCH="${2}"
        shift 2
      else
        help 0
      fi
      ;;
    "-b" | "--base")
      if [ -n "${2}" ]; then
        WAZUH_DASHBOARD_BRANCH="${2}"
        shift 2
      else
        help 0
      fi
      ;;
    "-r" | "--reporting")
      if [ -n "${2}" ]; then
        WAZUH_DASHBOARD_REPORTING_BRANCH="${2}"
        shift 2
      else
        help 0
      fi
      ;;
    "-sa" | "--securityAnalytics")
      if [ -n "${2}" ]; then
        WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH="${2}"
        shift 2
      else
        help 0
      fi
      ;;
    "-al" | "--alerting")
      if [ -n "${2}" ]; then
        WAZUH_DASHBOARD_ALERTING_BRANCH="${2}"
        shift 2
      else
        help 0
      fi
      ;;
    "-no" | "--notifications")
      if [ -n "${2}" ]; then
        WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH="${2}"
        shift 2
      else
        help 0
      fi
      ;;
    "--arm")
      ARCHITECTURE="arm"
      shift 1
      ;;
    "--node-version")
      if [ -n "${2}" ]; then
        NODE_VERSION="${2}"
        shift 2
      else
        help 0
      fi
      ;;
    *)
      echo "help"

      help 1
      ;;
    esac
  done

  if [ -z "$WAZUH_DASHBOARD_PLUGINS_BRANCH" ] | [ -z "$WAZUH_DASHBOARD_BRANCH" ] | [ -z "$WAZUH_SECURITY_PLUGIN_BRANCH" ] | [ -z "$WAZUH_DASHBOARD_REPORTING_BRANCH" ] | [ -z "$WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH" ] | [ -z "$WAZUH_DASHBOARD_ALERTING_BRANCH" ] | [ -z "$WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH" ]; then
    echo "You must specify the app, base, security, reporting, securityAnalytics, alerting and notifications."
    help 1
  fi

  run_docker_compose || exit 1

  exit 0
}

main "$@"
