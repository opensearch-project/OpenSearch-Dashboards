/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  decideClient,
  checkIndexExists,
  getErrorStatusCode,
  IndexAccessForbiddenError,
  fetchDepthLimit,
  isValidObject,
  validateFileTypes,
} from './util';
import { coreMock, opensearchServiceMock } from '../../../../core/server/mocks';
import { FileProcessorService } from '../processors/file_processor_service';
import { IFileProcessor } from '../types';
import { ClusterGetSettingsResponse } from '@opensearch-project/opensearch/api/types';
import { ApiResponse } from '@opensearch-project/opensearch';

describe('util', () => {
  describe('decideClient()', () => {
    const mockContext = {
      core: coreMock.createRequestHandlerContext(),
      dataSource: {
        opensearch: {
          getClient: jest.fn().mockReturnValue({}),
          legacy: {
            getClient: jest.fn(),
          },
        },
      },
    };

    beforeEach(() => {
      mockContext.dataSource.opensearch.getClient.mockClear();
    });

    it('should return MDS client', async () => {
      const dataSourceEnabled = true;
      const dataSourceId = 'foo';
      const client = await decideClient(dataSourceEnabled, mockContext, dataSourceId);
      expect(mockContext.dataSource.opensearch.getClient).toHaveBeenCalledWith(dataSourceId);
      expect(client).toMatchObject({});
    });

    it.each([
      {
        dataSourceEnabled: false,
        dataSourceId: undefined,
      },
      {
        dataSourceEnabled: true,
        dataSourceId: undefined,
      },
      {
        dataSourceEnabled: false,
        dataSourceId: 'foo',
      },
    ])(
      'should return local cluster client when dataSourceEnabled is $dataSourceEnabled and dataSourceId is $dataSourceId',
      async ({ dataSourceEnabled, dataSourceId }) => {
        const client = await decideClient(dataSourceEnabled, mockContext, dataSourceId);
        expect(client).toMatchObject(mockContext.core.opensearch.client.asCurrentUser);
      }
    );
  });

  describe('getErrorStatusCode()', () => {
    it('reads statusCode directly off the error', () => {
      expect(getErrorStatusCode({ statusCode: 403 })).toBe(403);
    });

    it('reads statusCode from meta when not top-level', () => {
      expect(getErrorStatusCode({ meta: { statusCode: 404 } })).toBe(404);
    });

    it('returns undefined when no status code is present', () => {
      expect(getErrorStatusCode(new Error('boom'))).toBeUndefined();
      expect(getErrorStatusCode(undefined)).toBeUndefined();
    });
  });

  describe('checkIndexExists()', () => {
    const makeClient = (existsImpl: jest.Mock) =>
      ({
        indices: { exists: existsImpl },
      }) as unknown as any;

    it('returns the exists body when the call succeeds', async () => {
      const client = makeClient(jest.fn().mockResolvedValue({ body: true }));
      await expect(checkIndexExists(client, 'my_index')).resolves.toBe(true);
      expect(client.indices.exists).toHaveBeenCalledWith({ index: 'my_index' });
    });

    it('returns false when the index does not exist', async () => {
      const client = makeClient(jest.fn().mockResolvedValue({ body: false }));
      await expect(checkIndexExists(client, 'my_index')).resolves.toBe(false);
    });

    it('translates a 403 (empty-body HEAD denial) into an actionable permission error', async () => {
      // The exists API is a HEAD request, so a security-plugin 403 comes back
      // with an empty body: the raw error stringifies to "" without this.
      const client = makeClient(jest.fn().mockRejectedValue({ statusCode: 403, body: '' }));
      await expect(checkIndexExists(client, 'lookup_hosts')).rejects.toThrow(
        /do not have permission to access index "lookup_hosts"/
      );
    });

    it('throws a 403-carrying IndexAccessForbiddenError so routes can respond forbidden', async () => {
      const client = makeClient(jest.fn().mockRejectedValue({ statusCode: 403 }));
      await expect(checkIndexExists(client, 'lookup_hosts')).rejects.toBeInstanceOf(
        IndexAccessForbiddenError
      );
      await checkIndexExists(client, 'lookup_hosts').catch((e) => {
        expect(e.statusCode).toBe(403);
      });
    });

    it('translates a 403 reported under meta.statusCode', async () => {
      const client = makeClient(jest.fn().mockRejectedValue({ meta: { statusCode: 403 } }));
      await expect(checkIndexExists(client, 'lookup_hosts')).rejects.toThrow(/indices:admin\/get/);
    });

    it('rethrows non-403 errors unchanged', async () => {
      const original = new Error('connection refused');
      const client = makeClient(jest.fn().mockRejectedValue(original));
      await expect(checkIndexExists(client, 'my_index')).rejects.toBe(original);
    });
  });

  describe('validateEnabledFileTypes()', () => {
    let fileProcessorService: FileProcessorService;

    beforeEach(() => {
      fileProcessorService = new FileProcessorService();
    });

    it.each([
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson', 'geojson'],
        throwsError: false,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson'],
        throwsError: false,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: [],
        throwsError: false,
      },
      {
        registeredFileTypes: [],
        configEnabledFileTypes: [],
        throwsError: false,
      },
      {
        registeredFileTypes: [],
        configEnabledFileTypes: ['json'],
        throwsError: true,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson', 'json'],
        throwsError: true,
      },
      {
        registeredFileTypes: ['csv', 'ndjson', 'geojson'],
        configEnabledFileTypes: ['csv', 'ndjson', 'json', 'geojson'],
        throwsError: true,
      },
    ])(
      'should throw an error should be $throwsError',
      ({ registeredFileTypes, configEnabledFileTypes, throwsError }) => {
        const dummyFileProcessor: IFileProcessor = {
          validateText: jest.fn(),
          ingestText: jest.fn(),
          ingestFile: jest.fn(),
          parseFile: jest.fn(),
        };

        registeredFileTypes.forEach((fileType: string) => {
          fileProcessorService.registerFileProcessor(fileType, { ...dummyFileProcessor });
        });

        if (throwsError) {
          expect(() => {
            validateFileTypes(configEnabledFileTypes, fileProcessorService);
          }).toThrow();
        } else {
          expect(() => {
            validateFileTypes(configEnabledFileTypes, fileProcessorService);
          }).not.toThrow();
        }
      }
    );
  });

  describe('fetchDepthLimit()', () => {
    interface CreateMockSettingsResponseProps {
      persistentSettingsLimit?: number;
      transientSettingsLimit?: number;
      defaultSettingsLimit?: number;
    }

    const generateSettingsObject = (limit: number) => {
      return {
        indices: {
          mapping: {
            depth: {
              limit,
            },
          },
        },
      };
    };

    const createMockResponse = ({
      persistentSettingsLimit,
      transientSettingsLimit,
      defaultSettingsLimit,
    }: CreateMockSettingsResponseProps): Pick<ApiResponse<ClusterGetSettingsResponse>, 'body'> => {
      return {
        body: {
          defaults: {
            ...(defaultSettingsLimit && generateSettingsObject(defaultSettingsLimit)),
          },
          persistent: {
            ...(persistentSettingsLimit && generateSettingsObject(persistentSettingsLimit)),
          },
          transient: {
            ...(transientSettingsLimit && generateSettingsObject(transientSettingsLimit)),
          },
        },
      };
    };

    const mockClient = opensearchServiceMock.createOpenSearchClient();

    beforeEach(() => {
      mockClient.cluster.getSettings.mockClear();
    });

    it.each([
      {
        defaultSettingsLimit: undefined,
        persistentSettingsLimit: undefined,
        transientSettingsLimit: undefined,
        expected: 20,
      },
      {
        defaultSettingsLimit: 3,
        persistentSettingsLimit: undefined,
        transientSettingsLimit: undefined,
        expected: 3,
      },
      {
        defaultSettingsLimit: undefined,
        persistentSettingsLimit: 5,
        transientSettingsLimit: undefined,
        expected: 5,
      },
      {
        defaultSettingsLimit: undefined,
        persistentSettingsLimit: undefined,
        transientSettingsLimit: 25,
        expected: 20,
      },
      {
        defaultSettingsLimit: 4,
        persistentSettingsLimit: 9,
        transientSettingsLimit: undefined,
        expected: 4,
      },
      {
        defaultSettingsLimit: 22,
        persistentSettingsLimit: undefined,
        transientSettingsLimit: 26,
        expected: 20,
      },
      {
        defaultSettingsLimit: 9,
        persistentSettingsLimit: undefined,
        transientSettingsLimit: 11,
        expected: 9,
      },
      {
        defaultSettingsLimit: 18,
        persistentSettingsLimit: 22,
        transientSettingsLimit: 24,
        expected: 18,
      },
    ])(
      'should return $expected as the depth limit when persistentSettingsLimit = $persistentSettingsLimit, transientSettingsLimit = $transientSettingsLimit, and defaultSettingsLimit = $defaultSettingsLimit',
      async (testCase) => {
        const mockedResponse = opensearchServiceMock.createApiResponse<ClusterGetSettingsResponse>(
          createMockResponse({ ...testCase })
        );
        mockClient.cluster.getSettings.mockResolvedValue(mockedResponse);

        expect(await fetchDepthLimit(mockClient)).toEqual(testCase.expected);
      }
    );

    it('should return the defaultLimit of 20 when the call to "_cluster/settings" fails', async () => {
      mockClient.cluster.getSettings.mockRejectedValue(new Error('Something went wrong'));

      expect(await fetchDepthLimit(mockClient)).toEqual(20);
    });
  });

  describe('isValidObject()', () => {
    const validObjects = [
      {
        a: null,
        B: {
          c: {
            d: 'foo',
          },
        },
      },
      {
        c: null,
      },
      {
        a: {
          b: [
            {
              c: {
                d: 'bar',
              },
            },
            {
              c: {
                d: 'baz',
              },
            },
          ],
        },
      },
    ];

    const invalidObjects = [
      {},
      {
        '': 'bar',
      },
      {
        a: 1245,
        '': 'bar',
      },
      {
        a: {
          b: {
            '': {
              d: 25,
            },
          },
        },
      },
      {
        a: {
          b: {
            c: true,
            '': {
              d: 25,
            },
          },
        },
      },
      {
        a: {},
      },
      {
        a: {
          b: [
            {
              c: 'foo',
            },
            {
              d: {
                '': 'baz',
              },
            },
          ],
        },
      },
      {
        a: {
          b: [
            {
              c: {
                d: '',
              },
            },
            {},
          ],
        },
      },
      {
        a: {
          b: [
            {
              '': {
                d: '',
              },
            },
          ],
        },
      },
    ];

    it.each(validObjects)('should return true for the valid object $obj', (obj) => {
      expect(isValidObject(obj)).toBe(true);
    });

    it.each(invalidObjects)('should return false for the invalid object $obj', (obj) => {
      expect(isValidObject(obj)).toBe(false);
    });
  });
});
