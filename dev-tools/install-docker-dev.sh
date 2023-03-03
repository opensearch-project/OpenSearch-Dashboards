#!/usr/bin/env bash

{ # this ensures the entire script is downloaded #

osd_docker_dev_install_dir(){
	printf "opensearch-dashboards-docker-dev"
}

osd_download(){
	curl --fail --compressed -q "$@"
}

osd_do_copy_dev_docker_files(){
	local INSTALL_DIR
	INSTALL_DIR="$(osd_docker_dev_install_dir)"
	local ENTRYPOINT_SRC
	ENTRYPOINT_SRC="https://raw.githubusercontent.com/opensearch-project/OpenSearch-Dashboards/main/docs/docker-dev/entrypoint.sh"
	local DOCKER_COMPOSE_SRC
	DOCKER_COMPOSE_SRC="https://raw.githubusercontent.com/opensearch-project/OpenSearch-Dashboards/main/docs/docker-dev/docker-compose.yml"

	mkdir -p "$INSTALL_DIR"
	osd_download -s "$ENTRYPOINT_SRC" -o "./$INSTALL_DIR/entrypoint.sh"
	osd_download -s "$DOCKER_COMPOSE_SRC" -o "./$INSTALL_DIR/docker-compose.yml"
}

osd_do_copy_dev_docker_files

} # this ensures the entire script is downloaded #
