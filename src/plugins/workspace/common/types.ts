/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';

export type DataSource = Pick<DataSourceAttributes, 'title'> & {
  // SavedObjectAttribute could be single or array
  id: string;
};
