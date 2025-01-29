/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from '../../../../core/public';
import { ImportResponse } from '../types';

export async function importText(
  http: HttpStart,
  text: string,
  textFormat: string,
  indexName: string,
  delimiter?: string,
  selectedDataSourceId?: string
) {
  const query = {
    indexName,
    fileType: textFormat,
    ...(selectedDataSourceId && { dataSource: selectedDataSourceId }),
    delimiter,
  };

  return await http.post<ImportResponse>('/api/static_data_ingestion/_import_text', {
    body: JSON.stringify({ text }),
    query,
  });
}
