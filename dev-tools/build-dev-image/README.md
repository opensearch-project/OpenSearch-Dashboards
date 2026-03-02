# Wazuh Dashboard Development Images

This directory contains tools and scripts for building Docker images for Wazuh Dashboard development environment.

## Files Overview

- **build-multiarch.sh**: Multi-architecture build script (AMD64 and ARM64)
- **wzd.dockerfile**: Dockerfile for building the development environment
- **install-plugins.sh**: Script that installs Wazuh plugins during build
- **entrypoint.sh**: Container startup script
- **plugins/**: Directory containing plugin definitions
- **README.md**: This documentation

## Quick Start

### Using the Multi-Architecture Script (Recommended)

Requirements:

- `buildx` plugin: https://github.com/docker/buildx
- QEMU (for arch emulation builds)

```bash
# Make the script executable
chmod +x build-multiarch.sh

# Build with default values (local only)
./build-multiarch.sh

# Build and push to registry
./build-multiarch.sh --push

# Build with custom branches
./build-multiarch.sh -w main -s main -r main -p main -sa main --tag latest --push
```

### Manual Docker Build

```bash
# Single architecture build
docker build \
  --build-arg NODE_VERSION=22.22.0 \
  --build-arg OPENSEARCH_DASHBOARD_VERSION=3.5.0.0 \
  --build-arg WAZUH_DASHBOARD_BRANCH=migrate-main-to-3.5.0 \
  --build-arg WAZUH_DASHBOARD_SECURITY_BRANCH=migrate-main-to-3.5.0.0 \
  --build-arg WAZUH_DASHBOARD_REPORTING_BRANCH=migrate-main-to-3.5.0.0 \
  --build-arg WAZUH_DASHBOARD_PLUGINS_BRANCH=migrate-main-to-3.5.0 \
  --build-arg WAZUH_DASHBOARD_SECURITY_ANALYTICS_BRANCH=migrate-main-to-3.5.0.0 \
  --build-arg WAZUH_DASHBOARD_ALERTING_BRANCH=main \
  --build-arg WAZUH_DASHBOARD_NOTIFICATIONS_BRANCH=maim \
  -t quay.io/wazuh/osd-dev:3.5.0-5.0.0 \
  -f wzd.dockerfile .
```

## Multi-Architecture Build Script

The `build-multiarch.sh` script simplifies building images for both AMD64 and ARM64 architectures.

### Script Options

| Option                        | Short | Description                                | Default                   |
| ----------------------------- | ----- | ------------------------------------------ | ------------------------- |
| `--node-version`              | `-n`  | Node.js version                            | `22.22.0`                 |
| `--opensearch-version`        | `-o`  | OpenSearch Dashboard version               | `3.5.0.0`                 |
| `--wazuh-branch`              | `-w`  | Wazuh Dashboard branch                     | `main`                    |
| `--security-branch`           | `-s`  | Wazuh Dashboard Security branch            | `main`                    |
| `--reporting-branch`          | `-r`  | Wazuh Dashboard Reporting branch           | `main`                    |
| `--plugins-branch`            | `-p`  | Wazuh Dashboard Plugins branch             | `main`                    |
| `--security-analytics-branch` | `-sa` | Wazuh Dashboard Security analystics branch | `main`                    |
| `--alerting-branch`           | `-al` | Wazuh Dashboard Alerting branch            | `main`                    |
| `--notifications-branch`      | `-no` | Wazuh Dashboard Notifications branch       | `main`                    |
| `--tag`                       | `-t`  | Docker image tag                           | `3.5.0-5.0.0`             |
| `--platform`                  | `-pl` | Target platform (architecture)             | `linux/amd64,linux/arm64` |
| `--push`                      |       | Push image to registry                     | `false` (local build)     |
| `--help`                      | `-h`  | Show help message                          |                           |

### Examples

```bash
# Development build with latest branches
./build-multiarch.sh --wazuh-branch main --tag latest

# All branches from develop
./build-multiarch.sh -w develop -s develop -r develop -p develop -sa develop -al develop -no develop --tag develop --push

# Specific version build and push
./build-multiarch.sh --node-version 18.19.0 --tag 4.8.0-1.0.0 --push

# Feature branch testing
./build-multiarch.sh --wazuh-branch feature/new-feature --tag feature-test
```

## Manual Docker Commands

### Single Architecture Build

For specific architecture builds:

```bash
# For ARM64 (if you're on AMD64)
docker build --platform linux/arm64 \
  --build-arg NODE_VERSION=22.22.0 \
  --build-arg OPENSEARCH_DASHBOARD_VERSION=3.5.0.0 \
  --build-arg WAZUH_DASHBOARD_BRANCH=main \
  -t quay.io/wazuh/osd-dev:3.5.0-arm64 \
  -f wzd.dockerfile .

# For AMD64 (if you're on ARM64)
docker build --platform linux/amd64 \
  --build-arg NODE_VERSION=22.22.0 \
  --build-arg OPENSEARCH_DASHBOARD_VERSION=3.5.0.0 \
  --build-arg WAZUH_DASHBOARD_BRANCH=main \
  -t quay.io/wazuh/osd-dev:3.5.0-amd64 \
  -f wzd.dockerfile .
```

### Multi-Architecture Manual Build

```bash
# Create builder
docker buildx create --use --name multiarch

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg NODE_VERSION=22.22.0 \
  --build-arg OPENSEARCH_DASHBOARD_VERSION=3.5.0.0 \
  --build-arg WAZUH_DASHBOARD_BRANCH=main \
  -t quay.io/wazuh/osd-dev:3.5.0-5.0.0 \
  -f wzd.dockerfile \
  --push .
```

## Registry Setup

### Setting up Quay.io Credentials (One-time setup)

1. Login to Quay.io and navigate to User Settings
2. Click on `CLI Password: Generate Encrypted Password`
3. In the new window that opens, click on `Docker Configuration` and follow the steps

### Authentication

```bash
# Login to Quay.io
docker login quay.io
```

### Push Images

```bash
# Push single image
docker push quay.io/wazuh/osd-dev:version

# Multi-arch images are pushed automatically with --push flag in buildx
```

## Build Arguments

The following build arguments are supported:

- **NODE_VERSION**: Node.js runtime version (check `.nvmrc` file for compatibility)
- **OPENSEARCH_DASHBOARD_VERSION**: Base OpenSearch Dashboard version
- **WAZUH_DASHBOARD_BRANCH**: Main Wazuh Dashboard repository branch
- **WAZUH_DASHBOARD_SECURITY_BRANCH**: Security plugin branch
- **WAZUH_DASHBOARD_REPORTING_BRANCH**: Reporting plugin branch
- **WAZUH_DASHBOARD_PLUGINS_BRANCH**: Core plugins branch

## What the Image Contains

The built image includes:

- Node.js runtime environment
- Wazuh Dashboard with specified branch
- Pre-installed Wazuh plugins (security, reporting, core plugins)
- Development dependencies
- Configured workspace at `/home/node/kbn`

## Usage

### Running the Container

```bash
# Run development server
docker run -it --rm \
  -p 5601:5601 \
  quay.io/wazuh/osd-dev:latest

# Run with volume mounting for development
docker run -it --rm \
  -p 5601:5601 \
  -v $(pwd):/workspace \
  quay.io/wazuh/osd-dev:latest
```

### Multi-Platform Support

When you pull the image, Docker automatically downloads the correct architecture:

```bash
# This works on both AMD64 and ARM64
docker pull quay.io/wazuh/osd-dev:latest
```

## Troubleshooting

### Builder Issues

```bash
# Remove and recreate builder
docker buildx rm multiarch
docker buildx create --use --name multiarch
```

### Platform Support Check

```bash
# Check available platforms
docker buildx inspect multiarch
```

### Node Version Compatibility

Always check the `.nvmrc` file in the target branch to ensure Node.js version compatibility. The Node version should match what's defined for the specific platform version you're building.

## Development Workflow

1. **Feature Development**: Build with feature branch for testing
2. **Integration Testing**: Build with develop branches
3. **Release Preparation**: Build with release branches and push to registry
4. **Production**: Use stable tags with version numbers

Example workflow:

```bash
# Feature development
./build-multiarch.sh --wazuh-branch feature/my-feature --tag feature-test

# Integration testing
./build-multiarch.sh -w develop -s develop -r develop -p develop -sa develop -al develop -no develop --tag develop-test

# Release candidate
./build-multiarch.sh -w release/4.8.0 -s release/4.8.0 --tag 4.8.0-rc1 --push
```
