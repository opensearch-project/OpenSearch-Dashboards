/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from '../../../../core/public';
import { ImportResponse } from '../types';

export async function importFile(
  http: HttpStart,
  file: File,
  indexName: string,
  delimiter?: string,
  selectedDataSourceId?: string
) {
  const formData = new FormData();
  formData.append('file', file);
  const query = {
    indexName,
    ...(selectedDataSourceId && { dataSource: selectedDataSourceId }),
    delimiter,
  };

  return await http.post<ImportResponse>('/api/static_data_ingestion/_import_file', {
    body: formData,
    headers: {
      'Content-Type': undefined,
    },
    query,
  });
}
