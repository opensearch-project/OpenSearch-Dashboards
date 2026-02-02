/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';

let bannerId: string;

/**
 * @experimental This function is experimental and may change in future versions
 */
export const onRedirectNoDataView = (
  capabilities: CoreStart['application']['capabilities'],
  navigateToApp: CoreStart['application']['navigateToApp'],
  overlays: CoreStart['overlays']
) => () => {
  const canManageDataViews = capabilities.management.opensearchDashboards.dataViews;
  const redirectTarget = canManageDataViews
    ? '/management/opensearch-dashboards/indexPatterns'
    : '/home';
  let timeoutId: NodeJS.Timeout | undefined;

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const bannerMessage = i18n.translate('data.dataViews.ensureDefaultDataView.bannerLabel', {
    defaultMessage:
      'To visualize and explore data in OpenSearch Dashboards, you must create a dataset to retrieve data from the data source.',
  });

  // Avoid being hostile to new users who don't have a dataset setup yet
  // give them a friendly info message instead of a terse error message
  bannerId = overlays.banners.replace(
    bannerId,
    toMountPoint(<EuiCallOut color="warning" iconType="iInCircle" title={bannerMessage} />)
  );

  // hide the message after the user has had a chance to acknowledge it -- so it doesn't permanently stick around
  timeoutId = setTimeout(() => {
    overlays.banners.remove(bannerId);
    timeoutId = undefined;
  }, 15000);

  if (redirectTarget === '/home') {
    navigateToApp('home');
  } else {
    navigateToApp('management', {
      path: `/opensearch-dashboards/indexPatterns?bannerMessage=${bannerMessage}`,
    });
  }

  // return never-resolving promise to stop resolving and wait for the url change
  return new Promise(() => {});
};
