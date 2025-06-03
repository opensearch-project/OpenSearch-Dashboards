/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/public/mocks';
import { previewFile, PreviewFileProps } from './preview_file';

describe('previewFile()', () => {
  const httpMock = httpServiceMock.createStartContract();
  const mockMapping = {
    date_detection: true,
    dynamic: true,
    properties: {
      name: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
        },
      },
      gpa: {
        type: 'float',
      },
      grad_year: {
        type: 'long',
      },
    },
  };
  const documents = [
    { name: 'Laura Palmer', gpa: 3.85, grad_year: 2025 },
    { name: 'Audrey Horne', gpa: 3.52, grad_year: 2024 },
    { name: 'James Hurley', gpa: 3.72, grad_year: 2022 },
    { name: 'Shelly Johnson', gpa: 3.78, grad_year: 2026 },
  ];

  httpMock.post.mockResolvedValue({
    predictedMapping: { ...mockMapping },
    documents,
    existingMapping: { ...mockMapping },
  });

  it.each<PreviewFileProps>([
    {
      http: httpMock,
      file: new File([''], 'test.csv'),
      createMode: true,
      fileExtension: 'csv',
      indexName: 'test-index',
      previewCount: 4,
    },
    {
      http: httpMock,
      file: new File([''], 'test.ndjson'),
      createMode: true,
      fileExtension: 'ndjson',
      indexName: 'test-index',
      previewCount: 4,
      selectedDataSourceId: 'some-data-source-id',
    },
    {
      http: httpMock,
      file: new File([''], 'test.csv'),
      createMode: true,
      fileExtension: 'csv',
      indexName: 'test-index',
      previewCount: 4,
      selectedDataSourceId: 'some-data-source-id',
      delimiter: '|',
    },
  ])(
    'should call /api/data_importer/_preview with the correct args for a $fileExtension file',
    async (previewFileArgs) => {
      const {
        http,
        file,
        createMode,
        fileExtension,
        indexName,
        previewCount,
        delimiter,
        selectedDataSourceId,
      } = previewFileArgs;
      const response = await previewFile(previewFileArgs);
      const query = {
        indexName,
        fileExtension,
        createMode,
        previewCount,
        ...(selectedDataSourceId && { dataSource: selectedDataSourceId }),
        delimiter,
      };
      const formData = new FormData();
      formData.append('file', file);

      expect(response.documents).toMatchObject(documents);
      expect(response.predictedMapping).toMatchObject(mockMapping);
      expect(response.existingMapping).toMatchObject(mockMapping);
      expect(http.post).toBeCalledWith('/api/data_importer/_preview', {
        body: formData,
        headers: {
          'Content-Type': undefined,
        },
        query,
      });
    }
  );
});
