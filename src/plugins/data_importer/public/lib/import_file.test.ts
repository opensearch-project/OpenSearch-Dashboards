/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/public/mocks';
import { importFile, ImportFileProps } from './import_file';

describe('importFile()', () => {
  const httpMock = httpServiceMock.createStartContract();
  // @ts-ignore
  httpMock.post.mockImplementation((_, { query }: HttpFetchOptions) => {
    return Promise.resolve({
      success: true,
      message: {
        total: 5,
        message: `Indexed 5 documents into ${query?.indexName}`,
      },
    });
  });

  beforeEach(() => {
    httpMock.post.mockClear();
  });

  it.each<ImportFileProps>([
    {
      http: httpMock,
      file: new File([''], 'test.csv'),
      indexName: 'foo',
      delimiter: ';',
      createMode: true,
      fileExtension: '.csv',
      mapping: { foo: 'bar' },
      selectedDataSourceId: undefined,
    },
    {
      http: httpMock,
      file: new File([''], 'mds.csv'),
      indexName: 'bar',
      delimiter: ',',
      createMode: true,
      fileExtension: '.csv',
      mapping: { foo: 'bar' },
      selectedDataSourceId: 'datasource-csv',
    },
    {
      http: httpMock,
      file: new File([''], 'test.ndjson'),
      indexName: 'bar',
      createMode: false,
      delimiter: undefined,
      fileExtension: '.ndjson',
      selectedDataSourceId: undefined,
    },
    {
      http: httpMock,
      file: new File([''], 'mds.ndjson'),
      indexName: 'bar',
      createMode: true,
      fileExtension: '.ndjson',
      selectedDataSourceId: 'datasource-ndjson',
      mapping: { foo: 'bar' },
      delimiter: undefined,
    },
    {
      http: httpMock,
      file: new File([''], 'test.json'),
      indexName: 'baz',
      createMode: false,
      fileExtension: '.json',
      delimiter: undefined,
      selectedDataSourceId: undefined,
    },
    {
      http: httpMock,
      file: new File([''], 'mds.json'),
      indexName: 'qux',
      createMode: false,
      fileExtension: '.json',
      delimiter: undefined,
      selectedDataSourceId: 'datasource-json',
    },
  ])(
    'should call /api/data_importer/_import_file with the correct args for a $fileExtension file',
    async ({
      http,
      file,
      indexName,
      createMode,
      fileExtension,
      delimiter,
      selectedDataSourceId,
      mapping,
    }) => {
      const response = await importFile({
        http,
        file,
        createMode,
        fileExtension,
        indexName,
        delimiter,
        selectedDataSourceId,
        mapping,
      });
      expect(response.success).toBe(true);
      expect(response.message.total).toBe(5);
      const formData = new FormData();
      formData.append('file', file);
      if (mapping) {
        formData.append('mapping', JSON.stringify(mapping));
      }

      expect(httpMock.post).toBeCalledWith('/api/data_importer/_import_file', {
        query: {
          indexName,
          delimiter,
          createMode,
          fileExtension,
          ...(selectedDataSourceId && { dataSource: selectedDataSourceId }),
        },
        headers: {
          'Content-Type': undefined,
        },
        body: formData,
      });
    }
  );
});
