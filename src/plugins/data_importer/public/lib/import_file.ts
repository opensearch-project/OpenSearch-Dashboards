/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from '../../../../core/public';
import { ImportResponse } from '../types';

export interface ImportFileProps {
  http: HttpStart;
  file: File;
  indexName: string;
  createMode: boolean;
  fileExtension: string;
  delimiter?: string;
  selectedDataSourceId?: string;
  mapping?: Record<string, any>;
}

export async function importFile({
  http,
  file,
  indexName,
  createMode,
  fileExtension,
  delimiter,
  selectedDataSourceId,
  mapping,
}: ImportFileProps) {
  const formData = new FormData();
  formData.append('file', file);
  if (mapping) {
    formData.append('mapping', JSON.stringify(mapping));
  }

  const query = {
    indexName,
    createMode,
    fileExtension,
    ...(selectedDataSourceId && { dataSource: selectedDataSourceId }),
    delimiter,
  };

  return await http.post<ImportResponse>('/api/data_importer/_import_file', {
    body: formData,
    headers: {
      'Content-Type': undefined,
    },
    query,
  });
}
