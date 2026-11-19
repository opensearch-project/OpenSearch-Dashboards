/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { previewRoute } from './preview';
import { FileProcessorService } from '../processors/file_processor_service';
import { CSVProcessor } from '../processors/csv_processor';
import { httpServiceMock } from '../../../../core/server/mocks';
import { IRouter } from '../../../../core/server';
import { configSchema } from '../../config';

describe('Preview route', () => {
  const config = configSchema.validate({
    maxFileSizeBytes: 104857600,
    maxTextCount: 10000,
    filePreviewDocumentsCount: 10,
    enabledFileTypes: ['json', 'csv', 'ndjson'],
  });

  it('should infer the mapping from every preview row, not just the first', async () => {
    const router: jest.Mocked<IRouter> = httpServiceMock.createRouter();
    const fileProcessors = new FileProcessorService();
    fileProcessors.registerFileProcessor('csv', new CSVProcessor());
    previewRoute(router, config, fileProcessors, false);

    const mockClient = {
      cluster: { getSettings: jest.fn().mockRejectedValue(new Error('no settings')) },
      indices: { exists: jest.fn(), getMapping: jest.fn() },
    };
    const context = { core: { opensearch: { client: { asCurrentUser: mockClient } } } };
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'csv',
        delimiter: ',',
        previewCount: 10,
      },
      body: { file: Readable.from(['code,n\n', '123,1\n', 'N/A,2\n', '007,3']) },
    };
    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await handler(context, request, response);

    expect(response.ok).toHaveBeenCalled();
    const { predictedMapping, documents } = response.ok.mock.calls[0][0].body;
    expect(documents).toHaveLength(3);
    // row 1 alone would have said integer; row 2 ('N/A') widens it to text
    expect(predictedMapping.properties.code.type).toBe('text');
    expect(predictedMapping.properties.n).toEqual({ type: 'integer' });
  });
});
