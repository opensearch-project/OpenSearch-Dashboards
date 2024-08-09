/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import React from 'react';
import { EuiI18n } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ContentManagementPluginStart } from '../../../../../content_management/public';
import { IMPORT_SAMPLE_DATA_APP_ID } from '../../../../common/constants';

export const registerSampleDataCard = (
  contentManagement: ContentManagementPluginStart,
  core: CoreStart
) => {
  contentManagement.registerContentProvider({
    id: `get_start_sample_data`,
    getTargetArea: () => ['essential_overview/get_started'],
    getContent: () => ({
      id: 'sample_data',
      kind: 'card',
      order: 0,
      description: i18n.translate('home.sampleData.card.description', {
        defaultMessage: 'Explore sample data before adding your own.',
      }),
      title: i18n.translate('home.sampleData.card.title', {
        defaultMessage: 'Try openSearch',
      }),
      selectable: {
        children: <EuiI18n token="home.sampleData.card.footer" default="with Sample Datasets" />,
        isSelected: false,
        onClick: () => {
          // TODO change to a modal
          core.application.navigateToApp(IMPORT_SAMPLE_DATA_APP_ID);
        },
      },
    }),
  });
};
