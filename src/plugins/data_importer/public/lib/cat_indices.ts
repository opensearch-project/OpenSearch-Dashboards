/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';
import { CatIndicesResponse } from '../types';

export interface CatIndicesProps {
  http: HttpStart;
  dataSourceId?: string;
}

export async function catIndices({ http, dataSourceId }: CatIndicesProps) {
  const query = dataSourceId ? { dataSource: dataSourceId } : undefined;
  return http.get<CatIndicesResponse>('/api/data_importer/_cat_indices', { query });
}
