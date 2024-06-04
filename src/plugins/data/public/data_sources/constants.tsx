/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataSourceUIGroupType } from './datasource/types';

export const DEFAULT_DATA_SOURCE_TYPE = 'default';
export const DEFAULT_DATA_SOURCE_NAME = i18n.translate('data.datasource.type.openSearchDefault', {
  defaultMessage: 'OpenSearch Default',
});
export const DEFAULT_DATA_SOURCE_DISPLAY_NAME = i18n.translate(
  'data.datasource.type.openSearchDefaultDisplayName',
  {
    defaultMessage: 'Index patterns',
  }
);

export const defaultDataSourceMetadata = {
  ui: {
    label: DEFAULT_DATA_SOURCE_DISPLAY_NAME,
    typeLabel: DEFAULT_DATA_SOURCE_DISPLAY_NAME,
    groupType: DataSourceUIGroupType.defaultOpenSearchDataSource,
    selector: {
      displayDatasetsAsSource: true,
    },
  },
};

export const DATA_SELECTOR_REFRESHER_POPOVER_TEXT = 'Refresh data selector';
export const DATA_SELECTOR_DEFAULT_PLACEHOLDER = 'Select a data source';
