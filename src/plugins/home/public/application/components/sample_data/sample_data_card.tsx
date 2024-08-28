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
  ContentProvider,
  ESSENTIAL_OVERVIEW_CONTENT_AREAS,
  SEARCH_OVERVIEW_CONTENT_AREAS,
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

  contentManagement.registerContentProvider(
    sampleDataCard(0, ESSENTIAL_OVERVIEW_CONTENT_AREAS.GET_STARTED)
  );
  contentManagement.registerContentProvider(
    sampleDataCard(30, SEARCH_OVERVIEW_CONTENT_AREAS.GET_STARTED)
  );
};
