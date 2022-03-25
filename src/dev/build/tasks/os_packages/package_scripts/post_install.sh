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

export OSD_PATH_CONF=${OSD_PATH_CONF:-<%= configDir %>}

set_chmod() {
  chmod -f 660 ${OSD_PATH_CONF}/opensearch_dashboards.yml || true
  chmod -f 2750 <%= dataDir %> || true
  chmod -f 2750 ${OSD_PATH_CONF} || true
}

set_chown() {
  chown -R <%= user %>:<%= group %> <%= dataDir %>
  chown -R root:<%= group %> ${OSD_PATH_CONF}
}

set_access() {
  set_chmod
  set_chown
}

case $1 in
  # Debian
  configure)
    if ! getent group "<%= group %>" >/dev/null; then
      addgroup --quiet --system "<%= group %>"
    fi

    if ! getent passwd "<%= user %>" >/dev/null; then
      adduser --quiet --system --no-create-home --disabled-password \
      --ingroup "<%= group %>" --shell /bin/false "<%= user %>"
    fi

    if [ -n "$2" ]; then
      IS_UPGRADE=true
    fi

    set_access
  ;;
  abort-deconfigure|abort-upgrade|abort-remove)
  ;;

  # Red Hat
  1|2)
    if ! getent group "<%= group %>" >/dev/null; then
      groupadd -r "<%= group %>"
    fi

    if ! getent passwd "<%= user %>" >/dev/null; then
      useradd -r -g "<%= group %>" -M -s /sbin/nologin \
      -c "opensearch_dashboards.service user" "<%= user %>"
    fi

    if [ "$1" = "2" ]; then
      IS_UPGRADE=true
    fi

    set_access
  ;;

  *)
      echo "post install script called with unknown argument \`$1'" >&2
      exit 1
  ;;
esac

if [ "$IS_UPGRADE" = "true" ]; then
  if command -v systemctl >/dev/null; then
      systemctl daemon-reload
  fi
fi
