/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from '../../../../core/public';
import { ImportResponse } from '../types';

export interface ImportTextProps {
  http: HttpStart;
  text: string;
  textFormat: string;
  indexName: string;
  createMode: boolean;
  delimiter?: string;
  selectedDataSourceId?: string;
  mapping?: Record<string, any>;
  importIdentifier?: string;
}

export async function importText({
  http,
  text,
  textFormat,
  indexName,
  createMode,
  delimiter,
  selectedDataSourceId,
  mapping,
  importIdentifier,
}: ImportTextProps) {
  const query = {
    indexName,
    fileType: textFormat,
    createMode,
    ...(selectedDataSourceId && { dataSource: selectedDataSourceId }),
    delimiter,
    ...(importIdentifier && { importIdentifier }),
  };

  return await http.post<ImportResponse>('/api/data_importer/_import_text', {
    body: JSON.stringify({ text, ...(mapping && { mapping: JSON.stringify(mapping) }) }),
    query,
  });
}
