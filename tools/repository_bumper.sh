#!/bin/bash
#
# Wazuh Security Dashboards Plugin repository bumper (Pure Shell Version)
# This script automates version and stage bumping across the repository using only shell commands.

set -e

# --- Global Variables ---
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null)
DATE_TIME=$(date "+%Y-%m-%d_%H-%M-%S-%3N")
LOG_FILE="${SCRIPT_PATH}/repository_bumper_${DATE_TIME}.log"
VERSION_FILE="${REPO_PATH}/VERSION.json"
PACKAGE_JSON="${REPO_PATH}/package.json"
VERSION=""
REVISION="00"
DATE=""
CURRENT_VERSION=""
TAG=false
WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE="${REPO_PATH}/.github/workflows/4_builderpackage_dashboard.yml"
DOCKERFILE_FOR_BASE_PACKAGES="${REPO_PATH}/dev-tools/build-packages/base-packages-to-base/base-packages.Dockerfile"
README_FOR_BASE_PACKAGES="${REPO_PATH}/dev-tools/build-packages/base-packages-to-base/README.md"
VERSION_PATTERN="[0-9]+\.[0-9]+\.[0-9]+"
DATE_PATTERN="[0-9]{4}-[0-9]{2}-[0-9]{2}"
RPM_CHANGELOG="${REPO_PATH}/dev-tools/build-packages/rpm/wazuh-dashboard.spec"
DEB_CHANGELOG="${REPO_PATH}/dev-tools/build-packages/deb/debian/changelog"

# --- Helper Functions ---

# Function to log messages
log() {
  local message="$1"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  echo "[${timestamp}] ${message}" | tee -a "$LOG_FILE"
}

# Function to perform portable sed in-place editing
sed_inplace() {
  local options=""
  local pattern=""
  local file=""

  # Parse arguments to handle options like -E
  while [[ $# -gt 0 ]]; do
    case $1 in
      -E|-r)
        options="$options $1"
        shift
        ;;
      *)
        if [ -z "$pattern" ]; then
          pattern="$1"
        elif [ -z "$file" ]; then
          file="$1"
        fi
        shift
        ;;
    esac
  done

  # Detect OS and use appropriate sed syntax
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS (BSD sed) requires empty string after -i
    sed -i '' $options "$pattern" "$file"
  else
    # Linux (GNU sed) doesn't require anything after -i
    sed -i $options "$pattern" "$file"
  fi
}

# Function to show usage
usage() {
  echo "Usage: $0 [--version VERSION --stage STAGE | --tag] [--date DATE] [--help]"
  echo ""
  echo "Parameters:"
  echo "  --version VERSION   Specify the version (e.g., 4.6.0)"
  echo "                      Required if --tag is not used"
  echo "  --stage STAGE       Specify the stage (e.g., alpha0, beta1, rc2, etc.)"
  echo "                      Required if --tag is not used"
  echo "  --date DATE         Specify the release date in yyyy-mm-dd format (e.g., 2025-04-15)"
  echo "                      Optional. Used for updating changelog entries. If not provided,"
  echo "                      changelog updates will be skipped."
  echo "  --tag               Generate a tag"
  echo "                      If --stage is not set, it will be stageless(e.g., v4.6.0)"
  echo "                      Otherwise it will be with the provided stage (e.g., v4.6.0-alpha1)"
  echo "                      If this is set, --version and --stage are not required."
  echo "  --help              Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --version 4.6.0 --stage alpha0 --date 2025-04-15"
  echo "  $0 --version 4.6.0 --stage alpha0"
  echo "  $0 --tag --stage alpha1 --date 2025-04-15"
  echo "  $0 --tag --date 2025-04-15"
  echo "  $0 --tag"
}

# --- Core Logic Functions ---

parse_arguments() {
  while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
    --version)
      VERSION="$2"
      shift 2
      ;;
    --stage)
      STAGE="$2"
      shift 2
      ;;
    --date)
      DATE="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    --tag)
      TAG=true
      shift
  ;;
    *)
      log "ERROR: Unknown option: $1" # Log error instead of just echo
      usage
      exit 1
      ;;
    esac
  done
}

# Function to validate input parameters
validate_input() {
   if [ -z "$VERSION" ] && [ "$TAG" != true ]; then
    log "ERROR: --version is required unless --tag is set"
    usage
    exit 1
  fi

  if [ -z "$STAGE" ] && [ "$TAG" != true ]; then
    log "ERROR: --stage is required unless --tag is set"
    usage
    exit 1
  fi

  if [ -n "$VERSION" ] && ! [[ $VERSION =~ ^$VERSION_PATTERN$ ]]; then
    log "ERROR: Version must be in the format x.y.z (e.g., 4.6.0)"
    exit 1
  fi

  if [ -n "$STAGE" ] && ! [[ $STAGE =~ ^[a-zA-Z]+[0-9]+$ ]]; then
    log "ERROR: Stage must be alphanumeric (e.g., alpha0, beta1, rc2)"
    exit 1
  fi

  if [ -n "$DATE" ] && ! [[ $DATE =~ ^$DATE_PATTERN$ ]]; then
    log "ERROR: Date must be in the format yyyy-mm-dd (e.g., 2025-04-15)"
    exit 1
  fi
}

# Function to perform pre-update checks and gather initial data
pre_update_checks() {
  if [ ! -f "$VERSION_FILE" ]; then
    log "ERROR: Root VERSION.json not found at $VERSION_FILE"
    exit 1
  fi

  # Attempt to extract version from VERSION.json using sed
  log "Attempting to extract current version from $VERSION_FILE using sed..."
  CURRENT_VERSION=$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*$/\1/p' "$VERSION_FILE" | head -n 1) # head -n 1 ensures only the first match is taken

  # Check if sed successfully extracted a version
  if [ -z "$CURRENT_VERSION" ]; then
    log "ERROR: Failed to extract 'version' from $VERSION_FILE using sed. Check file format or key presence."
    exit 1 # Exit if sed fails
  fi
  log "Successfully extracted version using sed: $CURRENT_VERSION"

  if [ "$CURRENT_VERSION" == "null" ]; then # Check specifically for "null" string if sed might output that
    log "ERROR: Could not read current version from $VERSION_FILE (value was 'null')"
    exit 1
  fi
  log "Current version detected in VERSION.json: $CURRENT_VERSION"

  # Attempt to extract stage from VERSION.json using sed
  log "Attempting to extract current stage from $VERSION_FILE using sed..."
  CURRENT_STAGE=$(sed -n 's/^[[:space:]]*"stage"[[:space:]]*:[[:space:]]*"\([^"]*\)".*$/\1/p' "$VERSION_FILE" | head -n 1) # head -n 1 ensures only the first match is taken

  # Check if sed successfully extracted a stage
  if [ -z "$CURRENT_STAGE" ]; then
    log "ERROR: Failed to extract 'stage' from $VERSION_FILE using sed. Check file format or key presence."
    exit 1 # Exit if sed fails
  fi
  log "Successfully extracted stage using sed: $CURRENT_STAGE"

  if [ "$CURRENT_STAGE" == "null" ]; then # Check specifically for "null" string if sed might output that
    log "ERROR: Could not read current stage from $VERSION_FILE (value was 'null')"
    exit 1
  fi
  log "Current stage detected in VERSION.json: $CURRENT_STAGE"

  # Attempt to extract current revision from package.json using sed
  log "Attempting to extract current revision from $PACKAGE_JSON using sed..."
  CURRENT_REVISION=$(sed -n '/"wazuh": {/,/}/ s/^[[:space:]]*"revision"[[:space:]]*:[[:space:]]*"\([^"]*\)".*$/\1/p' "$PACKAGE_JSON" | head -n 1)

  if [ -z "$CURRENT_REVISION" ]; then
    log "ERROR: Failed to extract 'revision' from $PACKAGE_JSON using sed. Check file format or key presence."
    exit 1
  fi
  log "Successfully extracted revision using sed: $CURRENT_REVISION"

  if [ "$CURRENT_REVISION" == "null" ]; then
    log "ERROR: Could not read current revision from $PACKAGE_JSON (value was 'null')"
    exit 1
  fi
  log "Current revision detected in package.json: $CURRENT_REVISION"

  log "Default revision set to: $REVISION" # Log default revision here
}

# Function to compare versions and determine revision
compare_versions_and_set_revision() {
  log "Comparing new version ($VERSION) with current version ($CURRENT_VERSION)..."

  # Split versions into parts using '.' as delimiter
  IFS='.' read -r -a NEW_VERSION_PARTS <<<"$VERSION"
  IFS='.' read -r -a CURRENT_VERSION_PARTS <<<"$CURRENT_VERSION"

  # Ensure both versions have 3 parts (Major.Minor.Patch)
  if [ ${#NEW_VERSION_PARTS[@]} -ne 3 ] || [ ${#CURRENT_VERSION_PARTS[@]} -ne 3 ]; then
    log "ERROR: Invalid version format detected during comparison. Both versions must be x.y.z."
    exit 1
  fi

  # Compare Major version
  if ((${NEW_VERSION_PARTS[0]} < ${CURRENT_VERSION_PARTS[0]})); then
    log "ERROR: New major version (${NEW_VERSION_PARTS[0]}) cannot be lower than current major version (${CURRENT_VERSION_PARTS[0]})."
    exit 1
  elif ((${NEW_VERSION_PARTS[0]} > ${CURRENT_VERSION_PARTS[0]})); then
    log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION) (Major increased)."
    REVISION="00" # Reset revision on major increase
  else
    # Major versions are equal, compare Minor version
    if ((${NEW_VERSION_PARTS[1]} < ${CURRENT_VERSION_PARTS[1]})); then
      log "ERROR: New minor version (${NEW_VERSION_PARTS[1]}) cannot be lower than current minor version (${CURRENT_VERSION_PARTS[1]}) when major versions are the same."
      exit 1
    elif ((${NEW_VERSION_PARTS[1]} > ${CURRENT_VERSION_PARTS[1]})); then
      log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION) (Minor increased)."
      REVISION="00" # Reset revision on minor increase
    else
      # Major and Minor versions are equal, compare Patch version
      if ((${NEW_VERSION_PARTS[2]} < ${CURRENT_VERSION_PARTS[2]})); then
        log "ERROR: New patch version (${NEW_VERSION_PARTS[2]}) cannot be lower than current patch version (${CURRENT_VERSION_PARTS[2]}) when major and minor versions are the same."
        exit 1
      elif ((${NEW_VERSION_PARTS[2]} > ${CURRENT_VERSION_PARTS[2]})); then
        log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION) (Patch increased)."
        REVISION="00" # Reset revision on patch increase
      else
        # Versions are identical (Major, Minor, Patch are equal)
        log "New version ($VERSION) is identical to current version ($CURRENT_VERSION)."
        log "Attempting to extract current revision from $PACKAGE_JSON using sed (Note: This is fragile)"
        local current_revision_val=$(sed -n 's/^[[:space:]]*"revision"[[:space:]]*:[[:space:]]*"\([^"]*\)".*$/\1/p' "$PACKAGE_JSON" | head -n 1)
        # Check if sed successfully extracted a revision
        if [ -z "$current_revision_val" ]; then
          log "ERROR: Failed to extract 'revision' from $PACKAGE_JSON using sed. Check file format or key presence."
          exit 1 # Exit if sed fails
        fi
        log "Successfully extracted revision using sed: $current_revision_val"
        if [ -z "$current_revision_val" ] || [ "$current_revision_val" == "null" ]; then
          log "ERROR: Could not read current revision from $PACKAGE_JSON"
          exit 1
        fi
        # Ensure CURRENT_REVISION is treated as a number (remove leading zeros for arithmetic if necessary, handle base 10)
        local current_revision_int=$((10#$current_revision_val))
        local new_revision_int=$((current_revision_int + 1))
        # Format back to two digits with leading zero
        if [ -n "$STAGE" ] && [ "$STAGE" != "$CURRENT_STAGE" ]; then
          REVISION=$(printf "%02d" "$new_revision_int")
          log "Current revision: $current_revision_val. New revision set to: $REVISION"
        else
          REVISION=$(printf "%02d" "$current_revision_int")
          log "Current revision: $current_revision_val."
        fi
      fi
    fi
  fi
  log "Final revision determined: $REVISION"
}

# Function to update VERSION.json
update_root_version_json() {
  if [ -f "$VERSION_FILE" ]; then
    log "Processing $VERSION_FILE"
    # Update version and revision in VERSION.json
    local modified=false

    # Update version in VERSION.json
    if [ -n "$VERSION" ] && [ "$CURRENT_VERSION" != "$VERSION" ]; then
      sed_inplace "s/^[[:space:]]*\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/  \"version\": \"$VERSION\"/" "$VERSION_FILE"
      modified=true
    fi

    # Update stage in VERSION.json
    if [ -n "$STAGE" ] && [ "$CURRENT_STAGE" != "$STAGE" ]; then
      sed_inplace "s/^[[:space:]]*\"stage\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/  \"stage\": \"$STAGE\"/" "$VERSION_FILE"
      modified=true
    fi

    if [[ $modified == true ]]; then
      log "Successfully updated $VERSION_FILE with new version: $VERSION and stage: $STAGE"
    fi
  else
    log "WARNING: $VERSION_FILE not found. Skipping update."
  fi
}

update_package_json() {
  if [ -f "$PACKAGE_JSON" ]; then
    log "Processing $PACKAGE_JSON"
    local modified=false
    # Update version and revision in package.json
    # "wazuh": {
    #   "version": "4.14.0",
    #   "revision": "00"
    # },
    # Update version and revision in package.json using the structure above
    # Use sed with address range to target lines within the "wazuh": { ... } block
    # Update version in package.json
    if [[ "$CURRENT_VERSION" != "$VERSION" ]]; then
      log "Attempting to update version to $VERSION within 'wazuh' object in $PACKAGE_JSON"
      # Note: This sed command assumes a specific formatting and might be fragile.
      # It looks for the block starting with a line containing "wazuh": { and ending with the next line containing only }
      # Within that block, it replaces the value on the line starting with "version":
      sed_inplace "/\"wazuh\": {/,/}/ s/^\([[:space:]]*\"version\"[[:space:]]*:[[:space:]]*\)\"[^\"]*\"/\1\"$VERSION\"/" "$PACKAGE_JSON"
      modified=true
    fi

    # Update revision in package.json
    if [[ "$CURRENT_REVISION" != "$REVISION" ]]; then
      log "Attempting to update revision to $REVISION within 'wazuh' object in $PACKAGE_JSON"
      # Similar sed command for the revision line within the same block
      sed_inplace "/\"wazuh\": {/,/}/ s/^\([[:space:]]*\"revision\"[[:space:]]*:[[:space:]]*\)\"[^\"]*\"/\1\"$REVISION\"/" "$PACKAGE_JSON"
      modified=true
    fi

    if [[ $modified == true ]]; then
      log "Successfully updated $PACKAGE_JSON with new version: $VERSION and revision: $REVISION"
    fi
  else
    log "WARNING: $PACKAGE_JSON not found. Skipping update."
  fi
}

# Function to update CHANGELOG.md
update_changelog() {
  log "Updating CHANGELOG.md..."
  local changelog_file="${REPO_PATH}/CHANGELOG.md"

  # Extract OpenSearch Dashboards version from package.json
  # Attempt to extract OpenSearch Dashboards version using sed (WARNING: Fragile!)
  # This assumes "pluginPlatform": { ... "version": "x.y.z" ... } structure
  # It looks for the block starting with "pluginPlatform": { and ending with }
  # Within that block, it finds the line starting with "version": "..." and extracts the value.
  # This is significantly less reliable than using jq.
  log "Attempting to extract .version from $PACKAGE_JSON using sed (Note: This is fragile)"
  # Extract OpenSearch Dashboards version from package.json (first occurrence of "version")
  OPENSEARCH_VERSION=$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*$/\1/p' "$PACKAGE_JSON" | head -n 1)
  if [ -z "$OPENSEARCH_VERSION" ] || [ "$OPENSEARCH_VERSION" == "null" ]; then
    log "ERROR: Could not extract pluginPlatform.version from $PACKAGE_JSON for changelog"
    exit 1
  fi
  log "Detected OpenSearch Dashboards version for changelog: $OPENSEARCH_VERSION"

  # Construct the new changelog entry
  # Note: Using printf for better handling of newlines and potential special characters
  # Use the calculated REVISION variable here
  # Prepare the header to search for
  local changelog_header="## Wazuh dashboard v${VERSION} - OpenSearch Dashboards ${OPENSEARCH_VERSION} - Revision "
  local changelog_header_regex="^${changelog_header}[0-9]+"

  # Check if an entry for this version and OpenSearch version already exists
  if grep -qE "$changelog_header_regex" "$changelog_file"; then
    if [ -n "$STAGE" ]; then
      log "Changelog entry for this version and OpenSearch Dashboards version exists. Updating revision only."
      # Use sed to update only the revision number in the header
      sed_inplace -E "s|(${changelog_header_regex})|${changelog_header}${REVISION}|" "$changelog_file" &&
        log "CHANGELOG.md revision updated successfully." || {
        log "ERROR: Failed to update revision in $changelog_file"
        exit 1
      }
    fi
  else
    log "No existing changelog entry for this version and OpenSearch Dashboards version. Inserting new entry."

   # Create the new entry directly in the changelog using sed
    local temp_file=$(mktemp)
    head -n 4 "$changelog_file" >"$temp_file"
    printf "## Wazuh dashboard v%s - OpenSearch Dashboards %s - Revision %s\n\n### Added\n\n- Support for Wazuh %s\n\n" "$VERSION" "$OPENSEARCH_VERSION" "$REVISION" "$VERSION" >>"$temp_file"
    tail -n +5 "$changelog_file" >>"$temp_file"

    mv "$temp_file" "$changelog_file" || {
      log "ERROR: Failed to update $changelog_file"
      rm -f "$temp_file" # Clean up temp file on error
      exit 1
    }
    log "CHANGELOG.md updated successfully."
  fi
}

update_build_workflow() {
  log "Updating $(basename $WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE)..."

  if [ -f "$WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE" ]; then
    local modified=false

    if [ "$TAG" = true ]; then
      replacement="v${VERSION}"
      if [ -n "$STAGE" ]; then
        replacement+="-${STAGE}"
      fi
    else
      replacement="${VERSION}"
    fi

    if grep -qE '\.yml@[^"[:space:]]+' "$WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE"; then
      log "Pattern found in $(basename $WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE). Attempting update..."
      # If the pattern exists, perform the substitution
      sed_inplace -E "s/(\.yml@)[^\"[:space:]]+/\1${replacement}/g" "$WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE"
      modified=true
    else
      log "Pattern not found in $(basename $WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE). Skipping update."
    fi

    if [[ $modified == true ]]; then
      log "Successfully updated references to @${replacement} in $(basename "$WAZUH_DASHBOARD_PLUGINS_WORKFLOW_FILE")"
    fi
  fi
}

update_base_package_dockerfile() {
  log "Updating $(basename $DOCKERFILE_FOR_BASE_PACKAGES)..."

  if [ -f "$DOCKERFILE_FOR_BASE_PACKAGES" ]; then
    local modified=false

    # Update all occurrences of _BRANCH=x.y.z with _BRANCH=$VERSION
    local branch_pattern_regex="(_BRANCH=)$VERSION_PATTERN"
    if grep -qE "$branch_pattern_regex" "$DOCKERFILE_FOR_BASE_PACKAGES"; then
      log "Pattern '$branch_pattern_regex' found in $(basename $DOCKERFILE_FOR_BASE_PACKAGES). Attempting update..."
      # Perform the substitution
      sed_inplace -E "s/${branch_pattern_regex}/\1${VERSION}/g" "$DOCKERFILE_FOR_BASE_PACKAGES"
      modified=true
    else
      log "Pattern '$branch_pattern_regex' not found in $(basename $DOCKERFILE_FOR_BASE_PACKAGES). Skipping update for this pattern."
    fi

    # Update all occurrences of wazuh-packages-to-base:x.y.z with wazuh-packages-to-base:$VERSION
    sed_inplace -E "s/(wazuh-packages-to-base:)$VERSION_PATTERN/\1${VERSION}/g" "$DOCKERFILE_FOR_BASE_PACKAGES" && modified=true

    if [[ $modified == true ]]; then
      log "Successfully updated $(basename $DOCKERFILE_FOR_BASE_PACKAGES)"
    fi
  fi
}

update_readme_for_base_packages() {
  log "Updating $(basename $README_FOR_BASE_PACKAGES)..."

  if [ -f "$README_FOR_BASE_PACKAGES" ]; then
    local modified=false

    # Update all occurrences of --app x.y.z with --app $VERSION
    # Define the pattern regex
    local app_pattern_regex="(--app )$VERSION_PATTERN"

    # Check if the pattern exists in the file
    if grep -qE "$app_pattern_regex" "$README_FOR_BASE_PACKAGES"; then
      log "Pattern '$app_pattern_regex' found in $(basename $README_FOR_BASE_PACKAGES). Attempting update..."
      # If the pattern exists, perform the substitution and set modified to true
      sed_inplace -E "s/${app_pattern_regex}/\1${VERSION}/g" "$README_FOR_BASE_PACKAGES"
      modified=true
    else
      log "Pattern '$app_pattern_regex' not found in $(basename $README_FOR_BASE_PACKAGES). Skipping update for this pattern."
    fi

    # Update all occurrences of --base x.y.z with --base $VERSION
    # Define the pattern regex for --base
    local base_pattern_regex="(--base )$VERSION_PATTERN"

    # Check if the pattern exists in the file
    if grep -qE "$base_pattern_regex" "$README_FOR_BASE_PACKAGES"; then
      log "Pattern '$base_pattern_regex' found in $(basename $README_FOR_BASE_PACKAGES). Attempting update..."
      # If the pattern exists, perform the substitution and set modified to true
      sed_inplace -E "s/${base_pattern_regex}/\1${VERSION}/g" "$README_FOR_BASE_PACKAGES"
      modified=true
    else
      log "Pattern '$base_pattern_regex' not found in $(basename $README_FOR_BASE_PACKAGES). Skipping update for this pattern."
    fi

    # Update all occurrences of --security x.y.z with --security $VERSION
    # Define the pattern regex for --security
    local security_pattern_regex="(--security )$VERSION_PATTERN"

    # Check if the pattern exists in the file
    if grep -qE "$security_pattern_regex" "$README_FOR_BASE_PACKAGES"; then
      log "Pattern '$security_pattern_regex' found in $(basename $README_FOR_BASE_PACKAGES). Attempting update..."
      # If the pattern exists, perform the substitution and set modified to true
      sed_inplace -E "s/${security_pattern_regex}/\1${VERSION}/g" "$README_FOR_BASE_PACKAGES"
      modified=true
    else
      log "Pattern '$security_pattern_regex' not found in $(basename $README_FOR_BASE_PACKAGES). Skipping update for this pattern."
    fi

    # Update all occurrences of --security x.y.z with --security $VERSION
    # Define the pattern regex for the example text
    local readme_example_pattern_regex="(This example will create a packages folder that inside will have the packages divided by repository of the )$VERSION_PATTERN"

    # Check if the pattern exists in the file
    if grep -qE "$readme_example_pattern_regex" "$README_FOR_BASE_PACKAGES"; then
      log "Pattern '$readme_example_pattern_regex' found in $(basename $README_FOR_BASE_PACKAGES). Attempting update..."
      # If the pattern exists, perform the substitution and set modified to true
      sed_inplace -E "s/${readme_example_pattern_regex}/\1${VERSION}/g" "$README_FOR_BASE_PACKAGES"
      modified=true
    else
      log "Pattern '$readme_example_pattern_regex' not found in $(basename $README_FOR_BASE_PACKAGES). Skipping update for this pattern."
    fi

    if [[ $modified == true ]]; then
      log "Successfully updated $(basename $README_FOR_BASE_PACKAGES)"
    fi
  fi
}

update_rendering_service_test_snap() {
  local rendering_service_test_snap="${REPO_PATH}/src/core/server/rendering/__snapshots__/rendering_service.test.ts.snap"

  if [ -f "$rendering_service_test_snap" ]; then
    log "Updating rendering service test snapshot..."

    # Update all occurrences of ("wazuhVersion": "x.y.z",) with ("wazuhVersion": "$VERSION",)
    # Define the pattern regex
    local pattern_regex="(\"wazuhVersion\": \")$VERSION_PATTERN"
    # Check if the pattern exists in the file
    if grep -qE "$pattern_regex" "$rendering_service_test_snap"; then
      log "Pattern '$pattern_regex' found in $(basename $rendering_service_test_snap). Attempting update..."
      # If the pattern exists, perform the substitution
      sed_inplace -E "s/${pattern_regex}/\1${VERSION}/g" "$rendering_service_test_snap"
      log "Successfully updated rendering service test snapshot."
    else
      log "Pattern '$pattern_regex' not found in $(basename $rendering_service_test_snap). Skipping update for this pattern."
    fi

  else
    log "ERROR: Rendering service test snapshot not found at $rendering_service_test_snap" >&2
  fi
}

update_healthcheck_server_not_ready_troubleshooting_link() {
  local file="${REPO_PATH}/src/core/server/healthcheck/healthcheck/config.ts"

  if [ -f "$file" ]; then
    log "Updating health check server not ready troubleshooting link..."

    # Strip off the last dot and everything after it
    local current_version_minor="${CURRENT_VERSION%.*}"
    local version_minor="${VERSION%.*}"

    if [[ "$current_version_minor" != "$version_minor" ]]; then
      # Update all occurrences of ("wazuhVersion": "x.y.z",) with ("wazuhVersion": "$VERSION",)
      # Define the pattern regex
      local pattern_regex="(https://documentation.wazuh.com/)$current_version_minor"
      # Check if the pattern exists in the file
      if grep -qE "$pattern_regex" "$file"; then
        log "Pattern '$pattern_regex' found in $(basename $file). Attempting update..."
        # If the pattern exists, perform the substitution
        sed_inplace -E "s|${pattern_regex}|\1${version_minor}|g" "$file"
        log "Successfully updated health check server not ready troubleshooting link."
      else
        log "Pattern '$pattern_regex' not found in $(basename $file). Skipping update for this pattern."
      fi
    fi

  else
    log "ERROR: health check server not ready troubleshooting link not found at $file" >&2
  fi
}

get_opensearch_dashboards_version(){
  log "Attempting to extract .version from $PACKAGE_JSON using sed (Note: This is fragile)"
  # Extract OpenSearch Dashboards version from package.json (first occurrence of "version")
  OPENSEARCH_VERSION=$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*$/\1/p' "$PACKAGE_JSON" | head -n 1)
  if [ -z "$OPENSEARCH_VERSION" ] || [ "$OPENSEARCH_VERSION" == "null" ]; then
    log "ERROR: Could not extract pluginPlatform.version from $PACKAGE_JSON for changelog"
    exit 1
  fi
}

get_node_version(){
  log "Attempting to get the NODE_VERSION from $PACKAGE_JSON using sed (Note: This is fragile)"

  local file="${REPO_PATH}/.nvmrc"
  NODE_VERSION=$(cat "${file}")
  if [ -z "$NODE_VERSION" ]; then
    log "ERROR: Could not extract NODE_VERSION from $file"
    exit 1
  fi
}

update_build_docker_dev_multiarch() {
  local file="${REPO_PATH}/dev-tools/build-dev-image/build-multiarch.sh"

  if [ -f "$file" ]; then
    log "Updating $file..."

    get_opensearch_dashboards_version
    get_node_version

    sed_inplace -E "s|OPENSEARCH_DASHBOARD_VERSION=\"[0-9.]+\"|OPENSEARCH_DASHBOARD_VERSION=\"$OPENSEARCH_VERSION.0\"|" "$file"
    sed_inplace -E "s|TAG=\"[0-9.-]+\"|TAG=\"$OPENSEARCH_VERSION-$VERSION\"|" "$file"
    sed_inplace -E "s|NODE_VERSION=\"[0-9.]+\"|NODE_VERSION=\"$NODE_VERSION\"|" "$file"
    log "Successfully updated $file"

  else
    log "ERROR: $file does not exist" >&2
  fi
}


update_build_docker_dev_multiarch_readme() {
  local file="${REPO_PATH}/dev-tools/build-dev-image/README.md"

  if [ -f "$file" ]; then
    log "Updating $file..."

    get_opensearch_dashboards_version
    get_node_version

    OPENSEARCH_DASHBOARD_VERSION_EXTENDED="$OPENSEARCH_VERSION.0"
    OSD_WZ_VERSION="$OPENSEARCH_VERSION-$VERSION"

    sed_inplace -E "s|--build-arg OPENSEARCH_DASHBOARD_VERSION=[0-9.]+|--build-arg OPENSEARCH_DASHBOARD_VERSION=$OPENSEARCH_DASHBOARD_VERSION_EXTENDED|" "$file"
    sed_inplace -E "s|--build-arg NODE_VERSION=[0-9.]+|--build-arg NODE_VERSION=$NODE_VERSION|g" "$file"
    sed_inplace -E "s|-t quay.io/wazuh/osd-dev:[0-9.]+-a|-t quay.io/wazuh/osd-dev:$OPENSEARCH_VERSION-a|" "$file"
    sed_inplace -E "s|-t quay.io/wazuh/osd-dev:[0-9.-]+ \\\\|-t quay.io/wazuh/osd-dev:$OSD_WZ_VERSION \\\\|" "$file"
    sed_inplace -E "s#(Node.js version \| \`)[0-9.-]+(\`)#\1$NODE_VERSION\2#" "$file"
    sed_inplace -E "s#(OpenSearch Dashboard version \| \`)[0-9.-]+(\`)#\1$OPENSEARCH_DASHBOARD_VERSION_EXTENDED\2#" "$file"
    sed_inplace -E "s#(Docker image tag \| \`)[0-9.-]+(\`)#\1$OSD_WZ_VERSION\2#" "$file"
    log "Successfully updated $file"

  else
    log "ERROR: $file does not exist" >&2
  fi
}

# Function to convert date from yyyy-mm-dd to RPM format (e.g., "Thu Sep 04 2025")
convert_date_to_rpm_format() {
  local input_date="$1"
  # Use date command to convert and format with English locale
  LC_ALL=C date -d "$input_date" "+%a %b %d %Y" 2>/dev/null || {
    log "ERROR: Invalid date format: $input_date"
    exit 1
  }
}

# Function to convert date from yyyy-mm-dd to Debian RFC 2822 format (e.g., "Thu, 04 Sep 2025 12:00:00 +0000")
convert_date_to_deb_format() {
  local input_date="$1"
  # Use date command to convert and format with English locale
  LC_ALL=C date -d "$input_date" "+%a, %d %b %Y 12:00:00 +0000" 2>/dev/null || {
    log "ERROR: Invalid date format: $input_date"
    exit 1
  }
}

# Function to update RPM changelog
update_rpm_changelog() {
  # Skip if no date provided
  if [ -z "$DATE" ]; then
    log "No date provided. Skipping RPM changelog update."
    return
  fi

  if [ ! -f "$RPM_CHANGELOG" ]; then
    log "WARNING: RPM changelog not found at $RPM_CHANGELOG. Skipping RPM changelog update."
    return
  fi

  log "Updating RPM changelog..."

  local rpm_date=$(convert_date_to_rpm_format "$DATE")
  local changelog_entry="* $rpm_date support <info@wazuh.com> - $VERSION"
  local more_info_entry="- More info: https://documentation.wazuh.com/current/release-notes/release-$(echo $VERSION | tr '.' '-').html"

  # Check if entry already exists
  if grep -q "* .* support <info@wazuh.com> - $VERSION" "$RPM_CHANGELOG"; then
    log "RPM changelog entry for version $VERSION already exists. Updating date..."
    # Update existing entry date
    sed -i "s/^\* .* support <info@wazuh.com> - $VERSION$/$changelog_entry/" "$RPM_CHANGELOG"
    log "Successfully updated RPM changelog date for version $VERSION"
  else
    log "Adding new RPM changelog entry for version $VERSION..."
    # Find the %changelog line and add new entry after it
    sed -i "/^%changelog$/a\\
$changelog_entry\\
$more_info_entry" "$RPM_CHANGELOG"
    log "Successfully added new RPM changelog entry for version $VERSION"
  fi
}

# Function to update Debian changelog
update_deb_changelog() {
  # Skip if no date provided
  if [ -z "$DATE" ]; then
    log "No date provided. Skipping Debian changelog update."
    return
  fi

  if [ ! -f "$DEB_CHANGELOG" ]; then
    log "WARNING: Debian changelog not found at $DEB_CHANGELOG. Skipping Debian changelog update."
    return
  fi

  log "Updating Debian changelog..."

  local deb_date=$(convert_date_to_deb_format "$DATE")
  local package_version="$VERSION-RELEASE"
  local changelog_header="wazuh-dashboard ($package_version) stable; urgency=low"
  local more_info_entry="  * More info: https://documentation.wazuh.com/current/release-notes/release-$(echo $VERSION | tr '.' '-').html"
  local maintainer_line=" -- Wazuh, Inc <info@wazuh.com>  $deb_date"

  # Escape parentheses and dots for grep and sed patterns
  local escaped_package_version=$(echo "$package_version" | sed 's/[().]/\\&/g')

  # Check if entry already exists
  if grep -q "wazuh-dashboard ($package_version)" "$DEB_CHANGELOG"; then
    log "Debian changelog entry for version $VERSION already exists. Updating date..."
    # Update existing entry date
    # Find the line with the version and then find the next maintainer line to update
    sed -i "/wazuh-dashboard ($escaped_package_version)/,/^ *-- Wazuh, Inc/ s|^ *-- Wazuh, Inc <info@wazuh.com> .*|$maintainer_line|" "$DEB_CHANGELOG"
    log "Successfully updated Debian changelog date for version $VERSION"
  else
    log "Adding new Debian changelog entry for version $VERSION..."
    # Create new entry at the top of the file using a temporary file approach
    {
      echo "$changelog_header"
      echo ""
      echo "$more_info_entry"
      echo ""
      echo "$maintainer_line"
      echo ""
      cat "$DEB_CHANGELOG"
    } > "${DEB_CHANGELOG}.tmp" && mv "${DEB_CHANGELOG}.tmp" "$DEB_CHANGELOG"
    log "Successfully added new Debian changelog entry for version $VERSION"
  fi
}

# --- Main Execution ---
main() {
  # Initialize log file
  touch "$LOG_FILE"
  log "Starting repository bump process"

  # Check if inside a git repository early
  if [ -z "$REPO_PATH" ]; then
    # Use log function for consistency, redirect initial error to stderr
    log "ERROR: Failed to determine repository root. Ensure you are inside the git repository." >&2
    exit 1
  fi
  log "Repository path: $REPO_PATH"

  # Parse and validate arguments
  parse_arguments "$@"
  validate_input

  log "Version: $VERSION"
  log "Stage: $STAGE"

  # Perform pre-update checks
  pre_update_checks

  if [ -z "$VERSION" ]; then
    VERSION=$CURRENT_VERSION # If no version provided, use current version
  fi

  compare_versions_and_set_revision

  # Start file modifications
  log "Starting file modifications..."

  update_root_version_json
  update_package_json
  update_build_workflow
  update_base_package_dockerfile
  update_readme_for_base_packages
  update_rendering_service_test_snap
  update_rpm_changelog
  update_deb_changelog
  update_changelog
  update_healthcheck_server_not_ready_troubleshooting_link
  update_build_docker_dev_multiarch
  update_build_docker_dev_multiarch_readme

  log "File modifications completed."
  log "Repository bump completed successfully. Log file: $LOG_FILE"
  exit 0
}

# Execute main function with all script arguments
main "$@"
