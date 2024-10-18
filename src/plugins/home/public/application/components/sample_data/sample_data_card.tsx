/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import React from 'react';
import { EuiI18n, EuiIcon, EuiTextColor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ContentManagementPluginStart,
  ContentProvider,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
} from '../../../../../content_management/public';
import { IMPORT_SAMPLE_DATA_APP_ID } from '../../../../common/constants';

export const registerSampleDataCard = (
  contentManagement: ContentManagementPluginStart,
  core: CoreStart
) => {
  const sampleDataCard = (order: number, targetArea: string): ContentProvider => ({
    id: `get_start_sample_data_${targetArea}`,
    getTargetArea: () => targetArea,
    getContent: () => ({
      id: 'sample_data',
      kind: 'card',
      order,
      description: i18n.translate('home.sampleData.card.description', {
        defaultMessage: 'Install sample data to experiment with OpenSearch.',
      }),
      title: '',
      onClick: () => {
        // TODO change to a modal
        core.application.navigateToApp(IMPORT_SAMPLE_DATA_APP_ID);
      },
      getIcon: () => <EuiIcon type="functionAdd" size="l" color="primary" />,
      getFooter: () => (
        <EuiTextColor color="subdued">
          <EuiI18n token="home.sampleData.card.footer" default="Sample datasets" />
        </EuiTextColor>
      ),
      cardProps: {
        className: 'usecaseOverviewGettingStartedCard',
      },
    }),
  });

  contentManagement.registerContentProvider(
    sampleDataCard(0, ESSENTIAL_OVERVIEW_CONTENT_AREAS.GET_STARTED)
  );
};
