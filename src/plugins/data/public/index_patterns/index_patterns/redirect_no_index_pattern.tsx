/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { EuiCallOut } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';

let bannerId: string;

export const onRedirectNoIndexPattern = (
  capabilities: CoreStart['application']['capabilities'],
  navigateToApp: CoreStart['application']['navigateToApp'],
  overlays: CoreStart['overlays']
) => () => {
  const canManageIndexPatterns = capabilities.management.opensearchDashboards.indexPatterns;
  const redirectTarget = canManageIndexPatterns
    ? '/management/opensearch-dashboards/indexPatterns'
    : '/home';
  let timeoutId: NodeJS.Timeout | undefined;

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  const bannerMessage = i18n.translate('data.indexPatterns.ensureDefaultIndexPattern.bannerLabel', {
    defaultMessage:
      'To visualize and explore data in OpenSearch Dashboards, you must create an index pattern to retrieve data from OpenSearch.',
  });

  // Avoid being hostile to new users who don't have an index pattern setup yet
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
