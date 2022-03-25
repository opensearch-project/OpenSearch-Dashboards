#!/bin/sh

#
# SPDX-License-Identifier: Apache-2.0
#
# The OpenSearch Contributors require contributions made to
# this file be licensed under the Apache-2.0 license or a
# compatible open source license.
#
# Any modifications Copyright OpenSearch Contributors. See
# GitHub history for details.
#

set -e

if command -v systemctl >/dev/null && systemctl is-active opensearch-dashboards.service >/dev/null; then
    systemctl --no-reload stop opensearch-dashboards.service
elif [ -x /etc/init.d/opensearch-dashboards ]; then
    if command -v invoke-rc.d >/dev/null; then
        invoke-rc.d opensearch-dashboards stop
    elif command -v service >/dev/null; then
        service opensearch-dashboards stop
    else
        /etc/init.d/opensearch-dashboards stop
    fi
fi
