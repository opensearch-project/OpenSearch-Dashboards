#!/bin/sh
set -e

if command -v systemctl >/dev/null && systemctl is-active opensearch_dashboards.service >/dev/null; then
    systemctl --no-reload stop opensearch_dashboards.service
elif [ -x /etc/init.d/opensearch-dashboards ]; then
    if command -v invoke-rc.d >/dev/null; then
        invoke-rc.d opensearch-dashboards stop
    elif command -v service >/dev/null; then
        service opensearch-dashboards stop
    else
        /etc/init.d/opensearch-dashboards stop
    fi
fi
