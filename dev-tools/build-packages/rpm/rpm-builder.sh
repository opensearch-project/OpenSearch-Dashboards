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
mkdir -p etc/services
cp "${config_path}"/* etc/services
jq '.version="'${version}'"' VERSION.json > VERSION.tmp && mv VERSION.tmp VERSION.json
jq '.commit="'${commit_sha}'"' VERSION.json > VERSION.tmp && mv VERSION.tmp VERSION.json
cd "${tmp_dir}"
tar -czf "${workspace_tar}" wazuh-dashboard-base

log "Setting up parameters"

if [ "${architecture}" = "x64" ]; then
  architecture="x86_64"
else
  architecture="aarch64"
fi

build_dir=/build
rpm_build_dir=${build_dir}/rpmbuild
directory_base="/usr/share/wazuh-dashboard"


pkg_name=${target}-${version}
pkg_path="${rpm_build_dir}/RPMS/${architecture}"
file_name="${target}-${version}-${revision}"
rpm_file="${file_name}.${architecture}.rpm"

if [ "$is_production" = "no" ]; then
  final_name="${target}_${version}-${revision}_${architecture}_${commit_sha}.rpm"
else
  final_name="${target}_${version}-${revision}_${architecture}.rpm"
fi

mkdir -p ${rpm_build_dir}/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}

mkdir ${build_dir}/${pkg_name}

# Including spec file
cp /usr/local/src/${target}.spec ${rpm_build_dir}/SPECS/${pkg_name}.spec
cd ${build_dir} && tar czf "${rpm_build_dir}/SOURCES/${pkg_name}.tar.gz" "${pkg_name}"

log "Building RPM..."
/usr/bin/rpmbuild -v \
    --define "_topdir ${rpm_build_dir}" \
    --define "_version ${version}" \
    --define "_release ${revision}" \
    --define "_localstatedir ${directory_base}" \
    --target ${architecture} \
    -ba ${rpm_build_dir}/SPECS/${pkg_name}.spec

cd ${pkg_path} && sha512sum ${rpm_file} >/${out_dir}/${rpm_file}.sha512

find ${pkg_path}/ -maxdepth 3 -type f -name "${file_name}*" -exec mv {} /${out_dir}/ \;
if [ "${is_production}" = "no" ]; then
  mv /${out_dir}/${rpm_file} /${out_dir}/${final_name}
  mv /${out_dir}/${rpm_file}.sha512 /${out_dir}/${final_name}.sha512
fi

