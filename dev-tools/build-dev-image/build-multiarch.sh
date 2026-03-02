#!/bin/bash

# Default values
NODE_VERSION="22.22.0"
OPENSEARCH_DASHBOARD_VERSION="3.5.0.0"
WAZUH_DASHBOARD_BRANCH="main"
WAZUH_DASHBOARD_SECURITY_BRANCH="main"
WAZUH_DASHBOARD_REPORTING_BRANCH="main"
WAZUH_DASHBOARD_PLUGINS_BRANCH="main"
WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH="main"
WAZUH_DASHBOARD_ALERTING_BRANCH="main"
WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH="main"
PLATFORM="linux/amd64,linux/arm64"
TAG="3.5.0-5.0.0"
PUSH=false

# Function to show help
show_help() {
cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    -n, --node-version              Node.js version (default: $NODE_VERSION)
    -o, --opensearch-version        OpenSearch Dashboard version (default: $OPENSEARCH_DASHBOARD_VERSION)
    -w, --wazuh-branch              Wazuh Dashboard branch (default: $WAZUH_DASHBOARD_BRANCH)
    -s, --security-branch           Wazuh Dashboard Security branch (default: $WAZUH_DASHBOARD_SECURITY_BRANCH)
    -r, --reporting-branch          Wazuh Dashboard Reporting branch (default: $WAZUH_DASHBOARD_REPORTING_BRANCH)
    -p, --plugins-branch            Wazuh Dashboard Plugins branch (default: $WAZUH_DASHBOARD_PLUGINS_BRANCH)
    -sa, --security-analytics-branch  Wazuh Dashboard Security Analytics branch (default: $WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH)
    -al, --alerting-branch          Wazuh Dashboard Alerting branch (default: $WAZUH_DASHBOARD_ALERTING_BRANCH)
    -no, --notifications-branch      Wazuh Dashboard Notifications branch (default: $WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH)
    -t, --tag                       Image tag (default: $TAG)
    -pl, --platform                 Target platform (default: $PLATFORM)
    --push                          Push image to registry
    -h, --help                      Show this help

EXAMPLES:
    $0 --wazuh-branch main --tag latest
    $0 -w develop -s develop -r develop -p develop --push
    $0 --node-version 22.22.0 --tag 3.5.0-1.0.0 --push
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--node-version)
            NODE_VERSION="$2"
            shift 2
            ;;
        -o|--opensearch-version)
            OPENSEARCH_DASHBOARD_VERSION="$2"
            shift 2
            ;;
        -w|--wazuh-branch)
            WAZUH_DASHBOARD_BRANCH="$2"
            shift 2
            ;;
        -s|--security-branch)
            WAZUH_DASHBOARD_SECURITY_BRANCH="$2"
            shift 2
            ;;
        -r|--reporting-branch)
            WAZUH_DASHBOARD_REPORTING_BRANCH="$2"
            shift 2
            ;;
        -p|--plugins-branch)
            WAZUH_DASHBOARD_PLUGINS_BRANCH="$2"
            shift 2
            ;;
        -sa|--security-analytics-branch)
            WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH="$2"
            shift 2
            ;;
        -al|--alerting-branch)
            WAZUH_DASHBOARD_ALERTING_BRANCH="$2"
            shift 2
            ;;
        -no|--notifications-branch)
            WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -pl|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Show configuration
echo "=== Build Configuration ==="
echo "Node Version: $NODE_VERSION"
echo "OpenSearch Dashboard Version: $OPENSEARCH_DASHBOARD_VERSION"
echo "Wazuh Dashboard Branch: $WAZUH_DASHBOARD_BRANCH"
echo "Security Branch: $WAZUH_DASHBOARD_SECURITY_BRANCH"
echo "Reporting Branch: $WAZUH_DASHBOARD_REPORTING_BRANCH"
echo "Plugins Branch: $WAZUH_DASHBOARD_PLUGINS_BRANCH"
echo "Security Analytics Branch: $WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH"
echo "Alerting Branch: $WAZUH_DASHBOARD_ALERTING_BRANCH"
echo "Notifications Branch: $WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH"
echo "Tag: quay.io/wazuh/osd-dev:$TAG"
echo "Platform: $PLATFORM"
echo "Push: $PUSH"
echo "==========================="

# Create multiarch builder if it doesn't exist
echo "Setting up multiarch builder..."
docker buildx inspect multiarch >/dev/null 2>&1 || docker buildx create --use --name multiarch

# Prepare buildx arguments
BUILDX_ARGS=(
    --platform "$PLATFORM"
    --build-arg NODE_VERSION="$NODE_VERSION"
    --build-arg OPENSEARCH_DASHBOARD_VERSION="$OPENSEARCH_DASHBOARD_VERSION"
    --build-arg WAZUH_DASHBOARD_BRANCH="$WAZUH_DASHBOARD_BRANCH"
    --build-arg WAZUH_DASHBOARD_SECURITY_BRANCH="$WAZUH_DASHBOARD_SECURITY_BRANCH"
    --build-arg WAZUH_DASHBOARD_REPORTING_BRANCH="$WAZUH_DASHBOARD_REPORTING_BRANCH"
    --build-arg WAZUH_DASHBOARD_PLUGINS_BRANCH="$WAZUH_DASHBOARD_PLUGINS_BRANCH"
    --build-arg WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH="$WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH"
    --build-arg WAZUH_DASHBOARD_ALERTING_BRANCH="$WAZUH_DASHBOARD_ALERTING_BRANCH"
    --build-arg WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH="$WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH"
    -t quay.io/wazuh/osd-dev:"$TAG"
    -f wzd.dockerfile
)

# Add --push if enabled
if [ "$PUSH" = true ]; then
    BUILDX_ARGS+=(--push)
else
    BUILDX_ARGS+=(--load)
fi

BUILDX_ARGS+=(.)

# Execute build
echo "Running docker buildx build..."
docker buildx build "${BUILDX_ARGS[@]}"

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    if [ "$PUSH" = true ]; then
        echo "📤 Image pushed to: quay.io/wazuh/osd-dev:$TAG"
    else
        echo "💾 Image loaded locally: quay.io/wazuh/osd-dev:$TAG"
    fi
else
    echo "❌ Build failed"
    exit 1
fi
