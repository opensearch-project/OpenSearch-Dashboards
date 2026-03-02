#!/bin/bash

# Wazuh package builder
# Copyright (C) 2021, Wazuh Inc.
#
# This program is a free software; you can redistribute it
# and/or modify it under the terms of the GNU General Public
# License (version 2) as published by the FSF - Free Software
# Foundation.

set -e

# Script parameters to build the package
target="wazuh-dashboard"
version=$1
revision=$2
architecture=$3
commit_sha=$4
is_production=$5
verbose=$6

directory_base="/usr/share/wazuh-dashboard"

# Paths
current_path="$( cd $(dirname $0) ; pwd -P )"

# Folders
tmp_dir="/tmp"
out_dir="/output"
config_path="${tmp_dir}/config"
workspace_dir="${tmp_dir}/wazuh-dashboard-base"
workspace_tar="${tmp_dir}/wazuh-dashboard.tar.gz"

if [ "$verbose" = "debug" ]; then
      set -x
fi

log() {
    if [ "$verbose" = "info" ] || [ "$verbose" = "debug" ]; then
        echo "$@"
    fi
}

clean() {
    exit_code=$?
    # Clean the files
    rm -rf "${workspace_dir}" "${workspace_tar}"
    trap '' EXIT
    exit ${exit_code}
}

trap clean INT
trap clean EXIT

rm -rf "${workspace_dir}" "${workspace_tar}"

mkdir -p "${workspace_dir}"
cd "${workspace_dir}"
log "Extracting base tar.gz..."
tar -zxf "${out_dir}/wazuh-dashboard-$version-$revision-linux-$architecture.tar.gz"
log "Preparing the package..."
jq '.wazuh.revision="'${revision}'"' package.json > pkgtmp.json && mv pkgtmp.json package.json
cp "${config_path}"/* .
jq '.version="'${version}'"' VERSION.json > VERSION.tmp && mv VERSION.tmp VERSION.json
jq '.commit="'${commit_sha}'"' VERSION.json > VERSION.tmp && mv VERSION.tmp VERSION.json
cd "${tmp_dir}"
tar -czf "${workspace_tar}" wazuh-dashboard-base

log "Setting up parameters"
if [ "${architecture}" = "x64" ]; then
  architecture="amd64"
fi
# Build directories
build_dir=/build
pkg_name="${target}-${version}"
pkg_path="${build_dir}/${target}"
source_dir="${pkg_path}/${pkg_name}"
deb_file="${target}_${version}-${revision}_${architecture}.deb"
final_name="${target}_${version}-${revision}_${architecture}_${commit_sha}.deb"

mkdir -p ${source_dir}/debian

# Including spec files
cp -r /usr/local/src/debian/* ${source_dir}/debian/

# Generating directory structure to build the .deb package
cd ${build_dir}/${target} && tar -czf ${pkg_name}.orig.tar.gz "${pkg_name}"

# Configure the package with the different parameters
sed -i "s:VERSION:${version}:g" ${source_dir}/debian/changelog
sed -i "s:RELEASE:${revision}:g" ${source_dir}/debian/changelog
sed -i "s:export INSTALLATION_DIR=.*:export INSTALLATION_DIR=${directory_base}:g" ${source_dir}/debian/rules

# Installing build dependencies
cd ${source_dir}
mk-build-deps -ir -t "apt-get -o Debug::pkgProblemResolver=yes -y"

log "Building the package..."
# Build package
debuild --no-lintian -b -uc -us \
    -eINSTALLATION_DIR="${directory_base}" \
    -eVERSION="${version}" \
    -eREVISION="${revision}"

cd ${pkg_path} && sha512sum ${deb_file} >/${out_dir}/${deb_file}.sha512

if [ "${is_production}" = "no" ]; then
  mv ${pkg_path}/${deb_file} /${out_dir}/${final_name}
  mv /${out_dir}/${deb_file}.sha512 /${out_dir}/${final_name}.sha512
else
  mv ${pkg_path}/${deb_file} /${out_dir}/
fi
