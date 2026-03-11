/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { importFileRoute } from './import_file';
import { FileProcessorService } from '../processors/file_processor_service';
import { httpServiceMock, loggingSystemMock } from '../../../../core/server/mocks';
import { IRouter } from '../../../../core/server';
import { Readable } from 'stream';
import { configSchema } from '../../config';

describe('Import file route', () => {
  let router: jest.Mocked<IRouter>;
  let fileProcessors: FileProcessorService;
  let mockProcessor: any;
  let context: any;
  let mockClient: any;

  const config = configSchema.validate({
    maxFileSizeBytes: 104857600,
    maxTextCount: 10000,
    filePreviewDocumentsCount: 10,
    enabledFileTypes: ['json', 'csv', 'ndjson'],
  });

  beforeEach(() => {
    router = httpServiceMock.createRouter();
    fileProcessors = new FileProcessorService();

    mockProcessor = {
      validateText: jest.fn(),
      ingestText: jest.fn(),
      ingestFile: jest.fn().mockResolvedValue({
        total: 5,
        failedRows: [],
      }),
      parseFile: jest.fn(),
    };

    fileProcessors.registerFileProcessor('json', mockProcessor);

    mockClient = {
      indices: {
        exists: jest.fn().mockResolvedValue({ body: false }),
        create: jest.fn().mockResolvedValue({}),
        updateAliases: jest.fn().mockResolvedValue({}),
      },
    };

    context = {
      core: {
        opensearch: {
          client: {
            asCurrentUser: mockClient,
          },
        },
      },
      dataImporter: {
        logger: loggingSystemMock.createLogger(),
      },
    };
  });

  it('should register POST route with correct path', () => {
    importFileRoute(router, config, fileProcessors, false);

    expect(router.post).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/data_importer/_import_file',
      }),
      expect.any(Function)
    );
  });

  it('should successfully import file without importIdentifier', async () => {
    importFileRoute(router, config, fileProcessors, false);

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'json',
      },
      body: {
        file: fileStream,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    expect(mockClient.indices.create).toHaveBeenCalledWith({
      index: 'test-index',
    });
    expect(mockProcessor.ingestFile).toHaveBeenCalledWith(fileStream, {
      indexName: 'test-index',
      client: mockClient,
      delimiter: undefined,
      dataSourceId: undefined,
      lookupId: undefined,
      lookupField: '__lookup',
    });
    expect(mockClient.indices.updateAliases).not.toHaveBeenCalled();
    expect(response.ok).toHaveBeenCalledWith({
      body: {
        message: {
          total: 5,
          failedRows: [],
        },
        success: true,
      },
    });
  });

  it('should successfully import file with importIdentifier and create alias', async () => {
    importFileRoute(router, config, fileProcessors, false);

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'json',
        importIdentifier: 'my-upload',
      },
      body: {
        file: fileStream,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    // Verify index was created with lookup field in mapping
    expect(mockClient.indices.create).toHaveBeenCalledWith({
      index: 'test-index',
      body: {
        mappings: {
          properties: {
            __lookup: {
              type: 'keyword',
            },
          },
        },
      },
    });

    // Verify ingestFile was called with lookupId
    const ingestCall = mockProcessor.ingestFile.mock.calls[0];
    expect(ingestCall[1]).toMatchObject({
      indexName: 'test-index',
      client: mockClient,
      lookupField: '__lookup',
    });
    expect(ingestCall[1].lookupId).toBeDefined();
    expect(typeof ingestCall[1].lookupId).toBe('string');

    // Verify alias was created
    expect(mockClient.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [
          {
            add: {
              index: 'test-index',
              alias: 'my-upload',
              filter: {
                term: {
                  __lookup: expect.any(String),
                },
              },
            },
          },
        ],
      },
    });

    expect(response.ok).toHaveBeenCalled();
  });

  it('should add lookup field to existing mapping when importIdentifier is provided', async () => {
    importFileRoute(router, config, fileProcessors, false);

    const existingMapping = JSON.stringify({
      properties: {
        name: { type: 'text' },
        age: { type: 'integer' },
      },
    });

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'json',
        importIdentifier: 'my-upload',
      },
      body: {
        file: fileStream,
        mapping: existingMapping,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    expect(mockClient.indices.create).toHaveBeenCalledWith({
      index: 'test-index',
      body: {
        mappings: {
          properties: {
            name: { type: 'text' },
            age: { type: 'integer' },
            __lookup: { type: 'keyword' },
          },
        },
      },
    });
  });

  it('should not create alias when there are failed rows', async () => {
    mockProcessor.ingestFile.mockResolvedValue({
      total: 5,
      failedRows: [1, 3],
    });

    importFileRoute(router, config, fileProcessors, false);

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'json',
        importIdentifier: 'my-upload',
      },
      body: {
        file: fileStream,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    expect(mockClient.indices.updateAliases).not.toHaveBeenCalled();
    expect(response.ok).toHaveBeenCalledWith({
      body: {
        message: {
          total: 5,
          failedRows: [1, 3],
        },
        success: false,
      },
    });
  });

  it('should not fail import when alias creation fails', async () => {
    mockClient.indices.updateAliases.mockRejectedValue(new Error('Alias creation failed'));

    importFileRoute(router, config, fileProcessors, false);

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'json',
        importIdentifier: 'my-upload',
      },
      body: {
        file: fileStream,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    // Verify import still succeeds despite alias failure
    expect(response.ok).toHaveBeenCalledWith({
      body: {
        message: {
          total: 5,
          failedRows: [],
        },
        success: true,
      },
    });

    // Verify error was logged
    expect(context.dataImporter.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create alias my-upload')
    );
  });

  it('should return badRequest for unsupported file type', async () => {
    importFileRoute(router, config, fileProcessors, false);

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'xml',
      },
      body: {
        file: fileStream,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    expect(response.badRequest).toHaveBeenCalledWith({
      body: 'xml is not a registered or supported filetype',
    });
  });

  it('should return badRequest when index already exists in createMode', async () => {
    mockClient.indices.exists.mockResolvedValue({ body: true });

    importFileRoute(router, config, fileProcessors, false);

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'json',
      },
      body: {
        file: fileStream,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    expect(response.badRequest).toHaveBeenCalledWith({
      body: 'Index test-index already exists',
    });
  });

  it('should return notFound when index does not exist in non-createMode', async () => {
    importFileRoute(router, config, fileProcessors, false);

    const fileStream = Readable.from(['test data']);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: false,
        fileExtension: 'json',
      },
      body: {
        file: fileStream,
      },
    };

    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
    };

    const handler = router.post.mock.calls[0][1];
    await handler(context, request, response);

    expect(response.notFound).toHaveBeenCalledWith({
      body: 'Index test-index does not exist',
    });
  });
});
