#!/bin/sh

# Package name
PACKAGE=""
# Container name
CONTAINER_NAME="wazuh-dashboard"
# Files to check
FILES="/etc/wazuh-dashboard/opensearch_dashboards.yml /usr/share/wazuh-dashboard"
# Owner of the files
FILE_OWNER="wazuh-dashboard"

# Remove container and image
clean() {
  docker stop $CONTAINER_NAME
  # This is done because in the construction of packages arm sometimes fails because it is not finished destroying the container and when trying to delete the image fails because it is in use.
  MAX_RETRIES=30
  RETRY_COUNT=0
  echo "Waiting for the container ($CONTAINER_NAME) to be removed"
  while docker ps -a --format "{{.Names}}" | grep $CONTAINER_NAME; do
    echo "The $(docker ps -a --format "{{.Names}}" | grep $CONTAINER_NAME) container has not been removed yet. Retry number $RETRY_COUNT."
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
      echo "WARNING: Maximum retries reached while waiting for container to stop"
      break
    fi
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
  done
  echo "Container removed. Removing the image"
  docker rmi -f $CONTAINER_NAME
}

# Check if files exist and are owned by wazuh-dashboard
files_exist() {
  for FILE in $FILES; do
    if docker exec $CONTAINER_NAME ls $FILE >/dev/null 2>&1; then
      file_owner=$(docker exec $CONTAINER_NAME stat -c '%U' $FILE)
      if [ "$file_owner" != "$FILE_OWNER" ]; then
        echo "ERROR: $FILE is owned by $file_owner instead of $FILE_OWNER"
        clean
        exit 1
      fi
      echo "$FILE exist and is owned by $FILE_OWNER"
    else
      echo "ERROR: $FILE does not exist"
      clean
      exit 1
    fi
  done
}

# Check if opensearch_dashboards.yml is the same as the one in the package
check_opensearch_dashboard_yml() {
  docker cp ../../config/opensearch_dashboards.prod.yml $CONTAINER_NAME:/tmp/opensearch_dashboards.yml

  diff_opensearch_dashboard_yml=$(docker exec $CONTAINER_NAME diff /etc/wazuh-dashboard/opensearch_dashboards.yml /tmp/opensearch_dashboards.yml)

  if [ -n "$diff_opensearch_dashboard_yml" ]; then
    echo "ERROR: opensearch_dashboards.yml is not the same as the one in the package"
    echo $diff_opensearch_dashboard_yml
    clean
    exit 1
  fi
  echo $(docker exec $CONTAINER_NAME diff /etc/wazuh-dashboard/opensearch_dashboards.yml /tmp/opensearch_dashboards.yml)
  echo "opensearch_dashboards.yml is the same as the one in the package"
}

# Check if metadata is correct for deb packages
check_metadata_deb() {

  IFS='_' read -r -a arrayNameFile <<< "$PACKAGE"
  metadataVersion=$(docker exec $CONTAINER_NAME apt show wazuh-dashboard | grep Version | awk '{print $2}')
  metadataPackage=$(docker exec $CONTAINER_NAME apt show wazuh-dashboard | grep Package | awk '{print $2}')
  metadataStatus=$(docker exec $CONTAINER_NAME apt show wazuh-dashboard | grep Status)

  # Check if metadata is correct
  if [ "${arrayNameFile[1]}" != "$metadataVersion" ]; then
    echo "ERROR: metadata version is not the same as the one in the package"
    echo "metadata version: $metadataVersion"
    echo "package version: ${arrayNameFile[1]}"
    clean
    exit 1
  elif [ "${arrayNameFile[0]}" != "$metadataPackage" ]; then
    echo "ERROR: metadata package is not the same as the one in the package"
    echo "metadata package: $metadataPackage"
    echo "package package: ${arrayNameFile[0]}"
    clean
    exit 1
  elif [ "$metadataStatus" != "Status: install ok installed" ]; then
    echo "ERROR: metadata status is not 'Status: install ok installed'"
    echo "metadata status: $metadataStatus"
    clean
    exit 1
  fi

  echo "metadata version is correct: $metadataVersion"
  echo "metadata package is correct: $metadataPackage"
  echo "metadata status is $metadataStatus"
}

check_metadata_rpm() {
  metadataVersion=$(docker exec $CONTAINER_NAME rpm -q --qf '%{VERSION}-%{RELEASE}' wazuh-dashboard)
  metadataPackage=$(docker exec $CONTAINER_NAME rpm -q --qf '%{NAME}' wazuh-dashboard)

  # Check if metadata is correct
  if [[ $PACKAGE != *"$metadataVersion"* ]]; then
    echo "ERROR: metadata version is not the same as the one in the package"
    echo "metadata version: $metadataVersion"
    echo "package version: $PACKAGE"
    clean
    exit 1
  elif [[ $PACKAGE != "$metadataPackage"* ]]; then
    echo "ERROR: metadata package is not the same as the one in the package"
    echo "metadata package: $metadataPackage"
    echo "package package: $PACKAGE"
    clean
    exit 1
  fi

  echo "metadata version is correct: $metadataVersion"
  echo "metadata package is correct: $metadataPackage"
}

# Run test
test() {

  if [[ $PACKAGE == *".deb" ]]; then
    docker build --build-arg PACKAGE=$PACKAGE -t $CONTAINER_NAME ./deb/
    docker run -it --rm -d --name $CONTAINER_NAME $CONTAINER_NAME
    check_metadata_deb
  elif [[ $PACKAGE == *".rpm" ]]; then
    docker build --build-arg PACKAGE=$PACKAGE -t $CONTAINER_NAME ./rpm/
    docker run -it --rm -d --name $CONTAINER_NAME $CONTAINER_NAME
    check_metadata_rpm
  else
    echo "ERROR: $PACKAGE is not a valid package (valid packages are .deb and .rpm ))"
    exit 1
  fi

  files_exist

  check_opensearch_dashboard_yml
}

# Show help
help() {
  echo
  echo "Usage: $0 [OPTIONS]"
  echo
  echo "    -p, --package <path>       Set Wazuh Dashboard rpm package name,which has to be in the <repository>/dev-tools/test-packages/<DISTRIBUTION>/ folder."
  echo
  exit $1
}

main() {
  while [ -n "${1}" ]; do
    case "${1}" in
    "-h" | "--help")
      help 0
      ;;
    "-p" | "--package")
      if [ -n "${2}" ]; then
        PACKAGE="${2}"
        shift 2
      else
        help 1
      fi
      ;;
    *)
      help 1
      ;;
    esac
  done

  if [ -z "$PACKAGE" ] ; then
    help 1
  fi

  test

  clean
}

main "$@"
