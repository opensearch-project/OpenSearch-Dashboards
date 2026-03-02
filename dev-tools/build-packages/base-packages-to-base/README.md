# Package building

This folder contains the tools used to create packages from the different repositories necessary for the creation of deb and rpm packages.

## Requirements

- A system with Docker.
- Internet connection (to download the docker images the first time).

## How to build packages

The script `run-docker-compose.sh` is in charge of coordinating the different steps to build each package.

### Building packages

The script can build a `.tar.gz` (former base), and `rpm` and `deb` packages. This can be for x64 and arm architectures (it is not cross-architecture building. You need to run the script in a machine of the same architecture that you are building).

The inputs are the following:

- `-a`, `--app`: Set the `wazuh-dashboard-plugins` branch.
- `-b`, `--base`: Set the `wazuh-dashboard` branch.
- `-s`, `--security`: Set the `wazuh-security-dashboards-plugin` branch.
- `-sa`, `--securityAnalytics`: Set the `wazuh-dashboard-security-analytics` branch.
- `-r`, `--reporting`: Set the `wazuh-dashboard-reporting` branch.
- `--node-version`: [Optional] Set the node version.
- `--arm`: [Optional] Build for arm64 instead of x64.

Example:

```bash
bash run-docker-compose.sh \
    --app main \
    --base main \
    --security main \
    --securityAnalytics main \
    --reporting main \
    --arm \
    --node-version 22.22.0
```

This example will create a packages folder that inside will have the packages divided by repository of the main branch of each one.
