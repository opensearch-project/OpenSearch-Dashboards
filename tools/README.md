# Repository Bumper Script

This script automates the process of updating the version, stage, and revision number across various files within the Wazuh Dashboard repository. It uses standard shell commands (`sed`, `awk`, `grep`, etc.) for modifications.

## Purpose

The primary goal of this script is to ensure consistency when releasing a new version or build stage (alpha, beta, rc) of the Wazuh Dashboard. It modifies key files to reflect the new version information, reducing the chance of manual errors.

## Usage

To run the script, navigate to the `tools` directory and execute it with the required parameters:

```bash
./repository_bumper.sh (--version <VERSION> --stage <STAGE>| --tag)
```

**Parameters:**

- `--tag`: Create a tag .If --stage is not set, it will be stageless(e.g., v4.6.0). Otherwise it will be with the provided stage (e.g., v4.6.0-alpha1)
- `--version VERSION`: Specify the target version in `x.y.z` format (e.g., `4.9.0`). **Required if --tag is not set**.
- `--stage STAGE`: Specify the build stage (e.g., `alpha0`, `beta1`, `rc2`, `stable`). **Required if --tag is not set**.
- `--help`: Display the help message.

**Example:**

```bash
./repository_bumper.sh --version 4.9.0 --stage beta1
./repository_bumper.sh --tag --stage alpha1
./repository_bumper.sh --tag
```

## Process

The script performs the following actions:

1.  **Initialization:** Sets up paths, date/time, and the log file (`repository_bumper_YYYY-MM-DD_HH-MM-SS-ms.log`).
2.  **Argument Parsing & Validation:** Reads the `--version` and `--stage` arguments and validates their format.
3.  **Pre-update Checks:**
    - Reads the current `version`, `stage` from `VERSION.json`.
    - Reads the current `revision` from `package.json` (within the `"wazuh"` object).
4.  **Version Comparison & Revision Determination:**
    - Compares the provided `--version` with the current version read from `VERSION.json`.
    - **Error Handling:** Prevents setting a lower version number.
    - **Revision Logic:**
      - If the new version (Major, Minor, or Patch) is _higher_ than the current version, the `revision` is reset to `00`.
      - If the new version is _identical_ to the current version, the existing `revision` (from `package.json`) is incremented (e.g., `00` -> `01`, `01` -> `02`).
5.  **File Modifications:** Updates the version, stage, and/or revision in the following files using `sed`:
    - `VERSION.json`: Updates `version` and `stage`.
    - `package.json`: Updates `version` and `revision` within the `"wazuh"` object.
    - `CHANGELOG.md`:
      - Updates the revision number in the header if an entry for the version already exists.
      - Adds a new entry with the specified version, stage, revision, and detected OpenSearch Dashboards version if no entry exists.
    - `.github/workflows/build_wazuh_dashboard_with_plugins.yml`: Updates references like `yml@vX.Y.Z` to `yml@v<VERSION>-<STAGE>`.
    - `dev-tools/build-packages/base-packages-to-base/base-packages.Dockerfile`: Updates `_BRANCH=X.Y.Z` and `wazuh-packages-to-base:X.Y.Z` references to use the new `<VERSION>`.
    - `dev-tools/build-packages/base-packages-to-base/README.md`: Updates version references in example commands (`--app X.Y.Z`, `--base X.Y.Z`, `--security X.Y.Z`) and descriptive text.
    - `src/core/server/rendering/__snapshots__/rendering_service.test.ts.snap`: Updates `"wazuhVersion": "X.Y.Z"` to use the new `<VERSION>`.
6.  **Logging:** All actions, errors, and results are logged to the timestamped log file in the `tools` directory.

## Notes

- The script relies heavily on `sed` with specific patterns. Changes to the structure of the target files might break the script.
- Ensure you are inside the git repository root when running the script, although it determines the root path automatically.
- Review the generated log file after execution to confirm all steps completed successfully.
