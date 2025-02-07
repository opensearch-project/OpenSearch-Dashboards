/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from '../../../../core/public';
import { PreviewResponse } from '../types';

export async function previewFile(
  http: HttpStart,
  file: File,
  createMode: boolean,
  fileExtension: string,
  indexName: string,
  delimiter?: string,
  selectedDataSourceId?: string
) {
  const formData = new FormData();
  formData.append('file', file);
  const query = {
    indexName,
    fileExtension,
    createMode,
    ...(selectedDataSourceId && { dataSource: selectedDataSourceId }),
    delimiter,
  };

  return await http.post<PreviewResponse>('/api/data_importer/_preview', {
    body: formData,
    headers: {
      'Content-Type': undefined,
    },
    query,
  });
}
