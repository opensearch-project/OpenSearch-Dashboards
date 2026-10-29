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
import { BulkIndexForbiddenError } from '../utils/util';

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
        // Default: the lookup alias does not exist yet (the client throws a 404 ResponseError)
        getAlias: jest
          .fn()
          .mockRejectedValue(Object.assign(new Error('alias missing'), { statusCode: 404 })),
        getMapping: jest.fn().mockResolvedValue({
          body: { 'test-index': { mappings: { properties: { zip: { type: 'keyword' } } } } },
        }),
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
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
        partial: false,
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
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

  const runImport = async (query: Record<string, unknown> = {}, mapping?: string) => {
    importFileRoute(router, config, fileProcessors, false);
    const request = {
      query: {
        indexName: 'test-index',
        createMode: true,
        fileExtension: 'json',
        importIdentifier: 'my-upload',
        ...query,
      },
      body: {
        file: Readable.from(['test data']),
        ...(mapping && { mapping }),
      },
    };
    const response = {
      ok: jest.fn((args) => args),
      badRequest: jest.fn((args) => args),
      notFound: jest.fn((args) => args),
      internalError: jest.fn((args) => args),
      forbidden: jest.fn((args) => args),
    };
    const handler = router.post.mock.calls[0][1];
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await handler(context, request, response);
    return response;
  };

  const partialFailure = {
    total: 3,
    message: 'Indexed 2 documents',
    failedRows: [2],
    errorSummary: [
      {
        type: 'mapper_parsing_exception',
        reason: 'failed to parse field [age] of type [integer]',
        count: 1,
        sampleRows: [2],
      },
    ],
  };

  it('should report success with partial=false and create the alias when every row lands', async () => {
    const allSuccess = {
      total: 3,
      message: 'Indexed 3 documents',
      failedRows: [],
      errorSummary: [],
    };
    mockProcessor.ingestFile.mockResolvedValue(allSuccess);

    const response = await runImport();

    expect(mockClient.indices.updateAliases).toHaveBeenCalledTimes(1);
    expect(response.ok).toHaveBeenCalledWith({
      body: { message: allSuccess, success: true, partial: false, aliasCreated: true },
    });
  });

  it('should still create the alias on partial failure so landed rows are not orphaned', async () => {
    mockProcessor.ingestFile.mockResolvedValue(partialFailure);

    const response = await runImport();

    const lookupId = mockProcessor.ingestFile.mock.calls[0][1].lookupId;
    expect(mockClient.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [
          {
            add: {
              index: 'test-index',
              alias: 'my-upload',
              filter: { term: { __lookup: lookupId } },
            },
          },
        ],
      },
    });
    expect(response.ok).toHaveBeenCalledWith({
      body: { message: partialFailure, success: false, partial: true, aliasCreated: true },
    });
  });

  it('should move an existing alias off the previous index atomically on re-import', async () => {
    // The lookup was previously imported into another index; re-importing must overwrite the
    // alias, not make it span both indices (which returns a union of old and new rows).
    mockClient.indices.getAlias.mockResolvedValue({
      body: {
        'old-index': { aliases: { 'my-upload': { filter: { term: { __lookup: 'old' } } } } },
      },
    });

    const response = await runImport();

    const lookupId = mockProcessor.ingestFile.mock.calls[0][1].lookupId;
    expect(mockClient.indices.getAlias).toHaveBeenCalledWith({ name: 'my-upload' });
    expect(mockClient.indices.updateAliases).toHaveBeenCalledTimes(1);
    expect(mockClient.indices.updateAliases).toHaveBeenCalledWith({
      body: {
        actions: [
          { remove: { index: 'old-index', alias: 'my-upload' } },
          {
            add: {
              index: 'test-index',
              alias: 'my-upload',
              filter: { term: { __lookup: lookupId } },
            },
          },
        ],
      },
    });
    expect(response.ok).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ aliasCreated: true }) })
    );
  });

  it('should flag aliasCreated=false and log when looking up the existing alias fails', async () => {
    mockClient.indices.getAlias.mockRejectedValue(
      Object.assign(new Error('security_exception'), { statusCode: 403 })
    );

    const response = await runImport();

    expect(mockClient.indices.updateAliases).not.toHaveBeenCalled();
    expect(response.ok).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          aliasCreated: false,
          aliasError:
            'You do not have permission to manage aliases. Try creating an index directly.',
        }),
      })
    );
    expect(context.dataImporter.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create alias my-upload')
    );
  });

  it('should not create an alias when no rows landed', async () => {
    const allFailed = {
      total: 2,
      message: 'Indexed 0 documents',
      failedRows: [1, 2],
      errorSummary: [
        {
          type: 'mapper_parsing_exception',
          reason: 'failed to parse field [age] of type [integer]',
          count: 2,
          sampleRows: [1, 2],
        },
      ],
    };
    mockProcessor.ingestFile.mockResolvedValue(allFailed);

    const response = await runImport();

    expect(mockClient.indices.updateAliases).not.toHaveBeenCalled();
    expect(response.ok).toHaveBeenCalledWith({
      body: { message: allFailed, success: false, partial: false, aliasCreated: false },
    });
  });

  it('responds forbidden (not internalError) when the ingester throws a bulk permission error', async () => {
    mockProcessor.ingestFile.mockRejectedValue(
      new BulkIndexForbiddenError(
        'You do not have permission to write to index "test-index". ' +
          'Importing requires the bulk write privilege (for example the ' +
          '"indices:data/write/bulk" action).'
      )
    );

    const response = await runImport();

    expect(response.forbidden).toHaveBeenCalledWith({
      body: expect.stringMatching(/indices:data\/write\/bulk/),
    });
    expect(response.internalError).not.toHaveBeenCalled();
    expect(response.ok).not.toHaveBeenCalled();
    // No rows landed, so no alias should be created
    expect(mockClient.indices.updateAliases).not.toHaveBeenCalled();
  });

  it('should report partial=true without aliasCreated when no importIdentifier is given', async () => {
    mockProcessor.ingestFile.mockResolvedValue(partialFailure);

    const response = await runImport({ importIdentifier: undefined });

    expect(mockClient.indices.updateAliases).not.toHaveBeenCalled();
    expect(response.ok).toHaveBeenCalledWith({
      body: { message: partialFailure, success: false, partial: true },
    });
  });

  describe('target mapping for type coercion', () => {
    it('should pass the create-mode mapping (incl. __lookup) to the processor', async () => {
      await runImport({}, JSON.stringify({ properties: { zip: { type: 'keyword' } } }));

      expect(mockClient.indices.getMapping).not.toHaveBeenCalled();
      expect(mockProcessor.ingestFile.mock.calls[0][1].mapping).toEqual({
        properties: { zip: { type: 'keyword' }, __lookup: { type: 'keyword' } },
      });
    });

    it('should fetch and pass the existing index mapping when not in create mode', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: true });

      await runImport({ createMode: false });

      expect(mockClient.indices.getMapping).toHaveBeenCalledWith({ index: 'test-index' });
      expect(mockProcessor.ingestFile.mock.calls[0][1].mapping).toEqual({
        properties: { zip: { type: 'keyword' } },
      });
    });

    it('should use the single concrete index mapping when importing through an alias', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.indices.getMapping.mockResolvedValue({
        body: { 'lookups-000001': { mappings: { properties: { id: { type: 'keyword' } } } } },
      });

      await runImport({ createMode: false });

      expect(mockProcessor.ingestFile.mock.calls[0][1].mapping).toEqual({
        properties: { id: { type: 'keyword' } },
      });
    });

    it('should continue without coercion and log when the mapping fetch fails', async () => {
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.indices.getMapping.mockRejectedValue(new Error('security_exception'));

      const response = await runImport({ createMode: false });

      expect(mockProcessor.ingestFile).toHaveBeenCalled();
      expect(mockProcessor.ingestFile.mock.calls[0][1].mapping).toBeUndefined();
      expect(response.ok).toHaveBeenCalled();
      expect(context.dataImporter.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch mapping for test-index')
      );
    });
  });

  it('should flag aliasCreated=false on partial failure when alias creation is denied', async () => {
    mockProcessor.ingestFile.mockResolvedValue(partialFailure);
    mockClient.indices.updateAliases.mockRejectedValue(new Error('security_exception'));

    const response = await runImport();

    expect(response.ok).toHaveBeenCalledWith({
      body: {
        message: partialFailure,
        success: false,
        partial: true,
        aliasCreated: false,
        aliasError: 'security_exception',
      },
    });
    expect(context.dataImporter.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create alias my-upload')
    );
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await handler(context, request, response);

    // Verify import still succeeds despite alias failure, but the response says the alias is missing
    expect(response.ok).toHaveBeenCalledWith({
      body: {
        message: {
          total: 5,
          failedRows: [],
        },
        success: true,
        partial: false,
        aliasCreated: false,
        aliasError: 'Alias creation failed',
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await handler(context, request, response);

    expect(response.notFound).toHaveBeenCalledWith({
      body: 'Index test-index does not exist',
    });
  });
});
