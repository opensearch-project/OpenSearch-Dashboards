/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import React from 'react';
import { EuiI18n } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ContentManagementPluginStart,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
} from '../../../../../content_management/public';
import { IMPORT_SAMPLE_DATA_APP_ID } from '../../../../common/constants';

export const registerSampleDataCard = (
  contentManagement: ContentManagementPluginStart,
  core: CoreStart
) => {
  contentManagement.registerContentProvider({
    id: `get_start_sample_data`,
    getTargetArea: () => [ESSENTIAL_OVERVIEW_CONTENT_AREAS.GET_STARTED],
    getContent: () => ({
      id: 'sample_data',
      kind: 'card',
      order: 0,
      description: i18n.translate('home.sampleData.card.description', {
        defaultMessage: 'You can install sample data to experiment with OpenSearch Dashboards.',
      }),
      title: i18n.translate('home.sampleData.card.title', {
        defaultMessage: 'Try openSearch',
      }),
      cardProps: {
        selectable: {
          children: <EuiI18n token="home.sampleData.card.footer" default="with Sample Datasets" />,
          isSelected: false,
          onClick: () => {
            // TODO change to a modal
            core.application.navigateToApp(IMPORT_SAMPLE_DATA_APP_ID);
          },
        },
      },
    }),
  });
};
