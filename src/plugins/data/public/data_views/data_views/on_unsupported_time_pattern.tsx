/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';

export const onUnsupportedTimePattern = (
  toasts: CoreStart['notifications']['toasts'],
  navigateToApp: CoreStart['application']['navigateToApp']
) => ({ id, title, index }: { id: string; title: string; index: string }) => {
  const warningTitle = i18n.translate('data.dataViews.warningTitle', {
    defaultMessage: 'Support for time interval index patterns removed',
  });

  const warningText = i18n.translate('data.dataViews.warningText', {
    defaultMessage:
      'Currently querying all indices matching {index}. {title} should be migrated to a wildcard-based index pattern.',
    values: { title, index },
  });

  // osdUrl was added to this service in #35262 before it was de-angularized, and merged in a PR
  // directly against the 7.x branch. Index patterns were de-angularized in #39247, and in order
  // to preserve the functionality from #35262 we need to get the injector here just for osdUrl.
  // This has all been removed as of 8.0.

  // 2019-12-01 The usage of osdUrl had to be removed due to the transition to NP.
  // It's now temporarily replaced by a simple replace of the single argument used by all URLs.
  // Once osdUrl is migrated to NP, this can be updated.

  toasts.addWarning({
    title: warningTitle,
    text: toMountPoint(
      <div>
        <EuiText size="s">
          <p>{warningText}</p>
        </EuiText>
        <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              onClick={() =>
                navigateToApp('management', {
                  path: `/opensearch-dashboards/data_views/data_view/${id! || ''}`,
                })
              }
            >
              <FormattedMessage
                id="data.dataViews.editDataView"
                defaultMessage="Edit index pattern"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    ),
  });
};
