#!/bin/bash

# Change working directory to the root of the repository
cd "${0%/*}/.."

COMPOSE_FILE=docker/dev.yml

# Check if 2nd argument is security
if [ "$2" = "security" ]; then
    export SECURITY_PLUGIN_REPO_PATH="../../wazuh-security-dashboards-plugin"
    COMPOSE_FILE=docker/dev_security.yml

fi

# Common variables
export REPO_PATH=$(pwd)
export NODE_VERSION=$(cat $REPO_PATH/.nvmrc)
export OPENSEARCH_VERSION=$(bash $REPO_PATH/docker/get_version.sh)

COMPOSE_CMD="docker compose -f $COMPOSE_FILE"

print_variables() {
    echo "NODE_VERSION: $NODE_VERSION"
    echo "OPENSEARCH_VERSION: $OPENSEARCH_VERSION"
}

case $1 in
up)
    print_variables
    $COMPOSE_CMD up -d
    ;;
down)
    echo "Cleaning up..."
    $COMPOSE_CMD exec wazuh-dashboard yarn osd clean
    $COMPOSE_CMD down
    ;;
stop)
    $COMPOSE_CMD stop
    ;;
*)
    echo "Usage: $0 {up|down|stop} [security]"
    exit 1
    ;;
esac
