/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceUIGroupType } from './datasource/types';
import { DEFAULT_DATA_SOURCE_DISPLAY_NAME } from './register_default_datasource';

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
    label: 'Amazon S3',
    typeLabel: 's3glue',
    groupType: DataSourceUIGroupType.s3glue,
    selector: {
      displayDatasetsAsSource: false,
    },
  },
};
