/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DataSourceUIGroupType } from './datasource/types';

export const S3_GLUE_DATA_SOURCE_DISPLAY_NAME = 'Amazon S3';
export const S3_GLUE_DATA_SOURCE_TYPE = 's3glue';
export const DEFAULT_DATA_SOURCE_TYPE = 'DEFAULT_INDEX_PATTERNS';
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

export const s3DataSourceMetadata = {
  ui: {
    label: S3_GLUE_DATA_SOURCE_DISPLAY_NAME,
    typeLabel: S3_GLUE_DATA_SOURCE_TYPE,
    groupType: DataSourceUIGroupType.s3glue,
    selector: {
      displayDatasetsAsSource: false,
    },
  },
};
