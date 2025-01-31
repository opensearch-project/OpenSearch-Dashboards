/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/public/mocks';
import { importFile } from './import_file';

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

  it.each([
    {
      file: new File([''], 'test.csv'),
      indexName: 'foo',
      delimiter: ';',
      selectedDataSourceId: undefined,
    },
    {
      file: new File([''], 'mds.csv'),
      indexName: 'bar',
      delimiter: ',',
      selectedDataSourceId: 'datasource-csv',
    },
    {
      file: new File([''], 'test.ndjson'),
      indexName: 'bar',
      selectedDataSourceId: undefined,
      delimiter: undefined,
    },
    {
      file: new File([''], 'mds.ndjson'),
      indexName: 'bar',
      selectedDataSourceId: 'datasource-ndjson',
      delimiter: undefined,
    },
    {
      file: new File([''], 'test.json'),
      indexName: 'baz',
      selectedDataSourceId: undefined,
      delimiter: undefined,
    },
    {
      file: new File([''], 'mds.json'),
      indexName: 'qux',
      selectedDataSourceId: 'datasource-json',
      delimiter: undefined,
    },
  ])(
    'should call /api/data_importer/_import_file with the correct args',
    async ({ file, indexName, delimiter, selectedDataSourceId }) => {
      const response = await importFile(httpMock, file, indexName, delimiter, selectedDataSourceId);
      expect(response.success).toBe(true);
      expect(response.message.total).toBe(5);
      const formData = new FormData();
      formData.append('file', file);

      expect(httpMock.post).toBeCalledWith('/api/data_importer/_import_file', {
        query: {
          indexName,
          delimiter,
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
