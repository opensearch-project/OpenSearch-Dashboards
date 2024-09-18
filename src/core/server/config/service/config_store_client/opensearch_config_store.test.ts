/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchResponse } from '../../../opensearch';
import { opensearchClientMock } from '../../../opensearch/client/mocks';
import { DYNAMIC_APP_CONFIG_ALIAS, DYNAMIC_APP_CONFIG_INDEX_PREFIX } from '../../utils/constants';
import { OpenSearchConfigStoreClient } from './opensearch_config_store_client';
import { ConfigDocument } from './types';
import _ from 'lodash';
import { ConfigBlob } from '../../types';
import {
  BulkOperationContainer,
  CatIndicesResponse,
  IndicesGetAliasResponse,
} from '@opensearch-project/opensearch/api/types';
import { getDynamicConfigIndexName } from '../../utils/utils';

describe('OpenSearchConfigStoreClient', () => {
  /**
   * Helper function to assert general map equality
   *
   * @param map1
   * @param map2
   */
  const assertMapsAreEqual = (map1: Map<string, any>, map2: Map<string, any>) => {
    expect(map1.size).toBe(map2.size);

    map1.forEach((value, key) => {
      expect(map2.get(key)).toMatchObject(value);
    });
  };

  interface OpenSearchClientMockProps {
    isListConfig: boolean;
    configDocuments: ConfigDocument[];
    existsAliasResult: boolean;
    getAliasIndicesResult: IndicesGetAliasResponse;
    catIndicesResult: CatIndicesResponse;
  }

  /**
   * Creates a new OpenSearch client mock complete with a mock for existsAlias(), cat.indices(), and search() results
   *
   * @param param0
   * @returns
   */
  const createOpenSearchClientMock = ({
    isListConfig,
    configDocuments,
    existsAliasResult,
    getAliasIndicesResult,
    catIndicesResult,
  }: OpenSearchClientMockProps) => {
    const mockClient = opensearchClientMock.createOpenSearchClient();

    mockClient.indices.existsAlias.mockResolvedValue(
      opensearchClientMock.createApiResponse<boolean>({
        body: existsAliasResult as any,
      })
    );

    mockClient.cat.indices.mockResolvedValue(
      opensearchClientMock.createApiResponse<CatIndicesResponse>({
        body: catIndicesResult,
      })
    );

    mockClient.indices.getAlias.mockResolvedValue(
      opensearchClientMock.createApiResponse<IndicesGetAliasResponse>({
        body: getAliasIndicesResult,
      })
    );

    // @ts-expect-error
    mockClient.search.mockImplementation((request, options) => {
      // Filters out results when the request is for getting/bulk getting configs
      const mockHits = isListConfig
        ? configDocuments
        : configDocuments.filter((configDocument) => {
            // @ts-expect-error
            const namespaces: string[] = request!.body!.query!.bool!.should![0].terms.config_name;
            return namespaces.includes(configDocument.config_name);
          });

      return Promise.resolve(
        opensearchClientMock.createApiResponse<SearchResponse<ConfigDocument>>({
          body: {
            hits: {
              hits: mockHits.map((hit) => ({
                _index: getDynamicConfigIndexName(1),
                _id: JSON.stringify(hit),
                _version: 1,
                _source: hit,
              })),
            },
          },
        })
      );
    });

    return mockClient;
  };

  const noDynamicConfigIndexResults: CatIndicesResponse = [
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_`,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_foo`,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_foo_2`,
    },
  ];

  const oneDynamicConfigIndexResult: CatIndicesResponse = [
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_1`,
    },
  ];

  const multipleDynamicConfigIndexResults: CatIndicesResponse = [
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_2`,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_4`,
    },
    {
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_800`,
    },
  ];

  const validAliasIndicesResponse: IndicesGetAliasResponse = {
    [`${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_4`]: { aliases: { DYNAMIC_APP_CONFIG_ALIAS: {} } },
  };

  const multipleAliasIndicesResponse: IndicesGetAliasResponse = {
    [`${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_4`]: { aliases: { DYNAMIC_APP_CONFIG_ALIAS: {} } },
    [`${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_2`]: { aliases: { DYNAMIC_APP_CONFIG_ALIAS: {} } },
  };

  const invalidAliasIndicesResponse: IndicesGetAliasResponse = {
    [`.some_random_index_8`]: { aliases: { DYNAMIC_APP_CONFIG_ALIAS: {} } },
  };

  const configDocument: ConfigDocument = {
    config_name: 'some_config_name',
    config_blob: {
      foo: {
        bar: 1,
      },
      baz: 'value',
    },
  };
  const configDocuments: ConfigDocument[] = [
    {
      config_name: 'config_a',
      config_blob: {
        level1: {
          name: 'Object1',
          value: 10,
          level2: {
            description: 'This is level 2 of object 1',
          },
        },
      },
    },
    {
      config_name: 'config_b',
      config_blob: {
        levelA: {
          flag: true,
          levelB: {
            items: ['item1', 'item2', 'item3'],
            levelC: {
              count: 3,
            },
          },
        },
      },
    },
    {
      config_name: 'config_c',
      config_blob: {
        section: {
          id: 'sec1',
          levelX: {
            title: 'Section Title',
            levelY: {
              status: 'active',
            },
          },
        },
      },
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDynamicConfigIndex()', () => {
    it.each([
      {
        existsAliasResult: false,
        catIndicesResult: noDynamicConfigIndexResults,
        getAliasIndicesResult: validAliasIndicesResponse,
        numCreateCalls: 1,
        numUpdateCalls: 0,
        errorThrown: false,
      },
      {
        existsAliasResult: false,
        catIndicesResult: multipleDynamicConfigIndexResults,
        getAliasIndicesResult: validAliasIndicesResponse,
        numCreateCalls: 0,
        numUpdateCalls: 1,
        errorThrown: false,
      },
      {
        existsAliasResult: false,
        catIndicesResult: oneDynamicConfigIndexResult,
        getAliasIndicesResult: validAliasIndicesResponse,
        numCreateCalls: 0,
        numUpdateCalls: 1,
        errorThrown: false,
      },
      {
        existsAliasResult: true,
        catIndicesResult: multipleDynamicConfigIndexResults,
        getAliasIndicesResult: {},
        numCreateCalls: 0,
        numUpdateCalls: 0,
        errorThrown: true,
      },
      {
        existsAliasResult: true,
        catIndicesResult: multipleDynamicConfigIndexResults,
        getAliasIndicesResult: multipleAliasIndicesResponse,
        numCreateCalls: 0,
        numUpdateCalls: 0,
        errorThrown: true,
      },
      {
        existsAliasResult: true,
        catIndicesResult: multipleDynamicConfigIndexResults,
        getAliasIndicesResult: invalidAliasIndicesResponse,
        numCreateCalls: 0,
        numUpdateCalls: 0,
        errorThrown: true,
      },
      {
        existsAliasResult: true,
        catIndicesResult: multipleDynamicConfigIndexResults,
        getAliasIndicesResult: validAliasIndicesResponse,
        numCreateCalls: 0,
        numUpdateCalls: 0,
        errorThrown: false,
      },
    ])(
      'should throw error should be $errorThrown, create() should be called $numCreateCalls times, and update() should be called $numUpdateCalls times',
      async ({
        existsAliasResult,
        catIndicesResult,
        getAliasIndicesResult,
        numCreateCalls,
        numUpdateCalls,
        errorThrown,
      }) => {
        const mockClient = createOpenSearchClientMock({
          isListConfig: false,
          configDocuments: [],
          existsAliasResult,
          getAliasIndicesResult,
          catIndicesResult,
        });
        const configStoreClient = new OpenSearchConfigStoreClient(mockClient);

        if (errorThrown) {
          expect(configStoreClient.createDynamicConfigIndex()).rejects.toThrowError();
        } else {
          await configStoreClient.createDynamicConfigIndex();
        }

        expect(mockClient.indices.existsAlias).toBeCalled();
        expect(mockClient.indices.create).toBeCalledTimes(numCreateCalls);
        expect(mockClient.indices.updateAliases).toBeCalledTimes(numUpdateCalls);
      }
    );
  });

  describe('getConfig()', () => {
    const expectedConfigBlob = _.cloneDeep(configDocument.config_blob);

    it('should use cache when necessary and return correct config', async () => {
      const mockClient = createOpenSearchClientMock({
        isListConfig: false,
        configDocuments: [configDocument],
        existsAliasResult: false,
        catIndicesResult: oneDynamicConfigIndexResult,
        getAliasIndicesResult: validAliasIndicesResponse,
      });
      const configStoreClient = new OpenSearchConfigStoreClient(mockClient);

      // Testing cache
      for (let i = 0; i < 2; i++) {
        const result = await configStoreClient.getConfig('some_config_name');
        expect(result).toMatchObject(expectedConfigBlob);
        expect(mockClient.search).toBeCalledTimes(1);
      }

      // Clearing cache should induce another search call
      configStoreClient.clearCache();
      const result3 = await configStoreClient.getConfig('some_config_name');
      expect(result3).toMatchObject(expectedConfigBlob);
      expect(mockClient.search).toBeCalledTimes(2);

      const nonExistentResult = await configStoreClient.getConfig('non_existent_config');
      expect(nonExistentResult).not.toBeDefined();
      expect(mockClient.search).toBeCalledTimes(3);
    });
  });

  describe('bulkGetConfigs()', () => {
    const expectedConfigMap = new Map(
      configDocuments.map((document) => [document.config_name, document.config_blob])
    );
    const createPartialExpectedConfigMap = (namesToKeep: string[]) => {
      return new Map([...expectedConfigMap].filter(([name, config]) => namesToKeep.includes(name)));
    };

    it('should use cache when necessary and return correct configs', async () => {
      const mockClient = createOpenSearchClientMock({
        isListConfig: false,
        configDocuments,
        existsAliasResult: false,
        catIndicesResult: oneDynamicConfigIndexResult,
        getAliasIndicesResult: validAliasIndicesResponse,
      });
      const configStoreClient = new OpenSearchConfigStoreClient(mockClient);

      const partialNames = ['config_a', 'config_b'];
      const expectedConfigMapPartial = createPartialExpectedConfigMap(partialNames);

      for (let i = 0; i < 2; i++) {
        const results = await configStoreClient.bulkGetConfigs(partialNames);
        assertMapsAreEqual(expectedConfigMapPartial, results);
        expect(mockClient.search).toBeCalledTimes(1);
      }

      // Partial cache hit initially, results are searched and found
      for (let i = 0; i < 2; i++) {
        const results = await configStoreClient.bulkGetConfigs([...partialNames, 'config_c']);
        assertMapsAreEqual(expectedConfigMap, results);
        expect(mockClient.search).toBeCalledTimes(2);
      }

      // Partial results
      for (let i = 0; i < 2; i++) {
        const results = await configStoreClient.bulkGetConfigs([
          ...partialNames,
          'non_existent_config',
        ]);
        assertMapsAreEqual(expectedConfigMapPartial, results);
        expect(mockClient.search).toBeCalledTimes(3);
      }

      // No results
      for (let i = 0; i < 2; i++) {
        const results = await configStoreClient.bulkGetConfigs([
          'non_existent_config',
          'other_nonexistent_config',
        ]);
        assertMapsAreEqual(new Map(), results);
        expect(mockClient.search).toBeCalledTimes(4);
      }
    });
  });

  describe('listConfigs', () => {
    it.each([
      {
        allConfigDocuments: [],
        expectedMap: new Map(),
      },
      {
        allConfigDocuments: [configDocument],
        expectedMap: new Map([[configDocument.config_name, configDocument.config_blob]]),
      },
      {
        allConfigDocuments: configDocuments,
        expectedMap: new Map(
          configDocuments.map((document) => [document.config_name, document.config_blob])
        ),
      },
    ])(
      'should return a Map containing $configDocuments.length configs',
      async ({ allConfigDocuments, expectedMap }) => {
        const mockClient = createOpenSearchClientMock({
          isListConfig: true,
          configDocuments: allConfigDocuments,
          existsAliasResult: false,
          catIndicesResult: oneDynamicConfigIndexResult,
          getAliasIndicesResult: validAliasIndicesResponse,
        });
        const configStoreClient = new OpenSearchConfigStoreClient(mockClient);
        const actualMap = await configStoreClient.listConfigs();

        assertMapsAreEqual(actualMap, expectedMap);
      }
    );
  });

  describe('createConfig()', () => {
    const itemId = 'some_item_id';
    const updatedConfigBlob = {
      foo: {
        bar: 5,
      },
      foobar: ['new', 'config'],
    };

    it.each([
      {
        newConfigDocuments: [],
        newConfigBlob: updatedConfigBlob,
        expectedBulkRequest: [
          {
            create: {
              _id: itemId,
              _index: DYNAMIC_APP_CONFIG_ALIAS,
              retry_on_conflict: 2,
              routing: '',
              version: 1,
              version_type: 'external',
            },
          },
          {
            config_name: 'some_config_name',
            config_blob: updatedConfigBlob,
          },
        ],
      },
      {
        newConfigDocuments: [configDocument],
        newConfigBlob: updatedConfigBlob,
        expectedBulkRequest: [
          {
            update: {
              _id: JSON.stringify(configDocument),
              _index: DYNAMIC_APP_CONFIG_ALIAS,
              retry_on_conflict: 2,
              routing: '',
              version: 2,
              version_type: 'external',
            },
          },
          {
            doc: {
              config_blob: updatedConfigBlob,
            },
          },
        ],
      },
    ])(
      'should call bulk() with correct operations',
      async ({ newConfigBlob, newConfigDocuments, expectedBulkRequest }) => {
        jest.spyOn(_, 'uniqueId').mockImplementation(() => itemId);
        const mockClient = createOpenSearchClientMock({
          isListConfig: false,
          configDocuments: newConfigDocuments,
          existsAliasResult: false,
          catIndicesResult: oneDynamicConfigIndexResult,
          getAliasIndicesResult: validAliasIndicesResponse,
        });
        const configStoreClient = new OpenSearchConfigStoreClient(mockClient);
        await configStoreClient.createConfig({
          config: {
            name: 'some_config_name',
            updatedConfig: newConfigBlob,
          },
        });

        expect(mockClient.bulk).toBeCalledWith({
          index: DYNAMIC_APP_CONFIG_ALIAS,
          body: expectedBulkRequest,
        });

        // Should cache result (search() is always called before bulk() to find existing configs)
        const result = await configStoreClient.getConfig('some_config_name');
        expect(result).toMatchObject(newConfigBlob);
        expect(mockClient.search).toBeCalledTimes(1);
      }
    );
  });

  describe('bulkCreateConfigs()', () => {
    const spyFunction = jest.spyOn(_, 'uniqueId');

    interface BulkCreateConfigTestCaseFormat {
      configsToCreate: ConfigDocument[];
      configsToUpdate: ConfigDocument[];
      existingConfigs: ConfigDocument[];
    }
    it.each<BulkCreateConfigTestCaseFormat>([
      {
        configsToCreate: [configDocument],
        existingConfigs: [],
        configsToUpdate: [],
      },
      {
        configsToCreate: [],
        existingConfigs: [configDocument],
        configsToUpdate: [
          {
            ...configDocument,
            config_blob: {
              foo: {
                bar: 5,
              },
              foobar: ['new', 'values'],
            },
          },
        ],
      },
      {
        configsToCreate: configDocuments,
        existingConfigs: [],
        configsToUpdate: [],
      },
      {
        configsToCreate: [configDocument],
        existingConfigs: configDocuments.slice(0, 2),
        configsToUpdate: [
          {
            ...configDocuments[0],
            config_blob: {
              level1: {
                name: 'updatedObject',
                level2: {
                  description: 'New description here',
                },
                bar: [1, 5],
              },
            },
          },
          {
            ...configDocuments[1],
            config_blob: {
              levelA: {
                flag: false,
                levelB: {
                  items: ['item1', 'item2', 'item4'],
                },
              },
            },
          },
        ],
      },
      {
        configsToCreate: [],
        existingConfigs: configDocuments,
        configsToUpdate: [
          {
            ...configDocuments[0],
            config_blob: {
              level1: {
                name: 'updatedObject',
                level2: {
                  description: 'New description here',
                },
                bar: [1, 5],
              },
            },
          },
          {
            ...configDocuments[1],
            config_blob: {
              levelA: {
                flag: false,
                levelB: {
                  items: ['item1', 'item2', 'item4'],
                },
              },
            },
          },
          {
            ...configDocuments[2],
            config_blob: {
              section: {
                id: 'sec1',
                levelX: {
                  title: 'Section Title',
                  levelY: {
                    status: 'active',
                  },
                },
              },
              otherSection: {
                values: [14, 11, 2],
              },
            },
          },
        ],
      },
    ])(
      'should call bulk() with correct operations',
      async ({ configsToCreate, configsToUpdate, existingConfigs }) => {
        configsToCreate.forEach((config) => {
          spyFunction.mockImplementationOnce(() => JSON.stringify(config));
        });
        const configMap = new Map();
        const expectedBulkRequest: Array<
          ConfigDocument | { doc: Pick<ConfigDocument, 'config_blob'> } | BulkOperationContainer
        > = [];
        const bulkCreateConfigsRequest: ConfigBlob[] = [];

        configsToUpdate.forEach((config) => {
          const oldConfig = existingConfigs.filter(
            (existingConfig) => existingConfig.config_name === config.config_name
          )[0];
          configMap.set(config.config_name, config.config_blob);
          expectedBulkRequest.push(
            {
              update: {
                _id: JSON.stringify(oldConfig),
                _index: DYNAMIC_APP_CONFIG_ALIAS,
                retry_on_conflict: 2,
                routing: '',
                version: 2,
                version_type: 'external',
              },
            },
            {
              doc: {
                config_blob: config.config_blob,
              },
            }
          );
          bulkCreateConfigsRequest.push({
            name: config.config_name,
            updatedConfig: config.config_blob,
          });
        });

        configsToCreate.forEach((config) => {
          configMap.set(config.config_name, config.config_blob);
          expectedBulkRequest.push(
            {
              create: {
                _id: JSON.stringify(config),
                _index: DYNAMIC_APP_CONFIG_ALIAS,
                retry_on_conflict: 2,
                routing: '',
                version: 1,
                version_type: 'external',
              },
            },
            {
              ...config,
            }
          );
          bulkCreateConfigsRequest.push({
            name: config.config_name,
            updatedConfig: config.config_blob,
          });
        });

        const mockClient = createOpenSearchClientMock({
          isListConfig: false,
          configDocuments: existingConfigs,
          existsAliasResult: false,
          catIndicesResult: oneDynamicConfigIndexResult,
          getAliasIndicesResult: validAliasIndicesResponse,
        });
        const configStoreClient = new OpenSearchConfigStoreClient(mockClient);
        await configStoreClient.bulkCreateConfigs({
          configs: bulkCreateConfigsRequest,
        });

        expect(mockClient.bulk).toBeCalledWith({
          index: DYNAMIC_APP_CONFIG_ALIAS,
          body: expectedBulkRequest,
        });

        // Should cache result (search() is always called before bulk() to find existing configs)
        const result = await configStoreClient.bulkGetConfigs([...configMap.keys()]);
        assertMapsAreEqual(result, configMap);
        expect(mockClient.search).toBeCalledTimes(1);
      }
    );
  });

  describe('deleteConfig()', () => {
    it('should call deleteByQuery() with correct arguments', async () => {
      const mockClient = createOpenSearchClientMock({
        isListConfig: false,
        configDocuments: [],
        existsAliasResult: false,
        catIndicesResult: oneDynamicConfigIndexResult,
        getAliasIndicesResult: validAliasIndicesResponse,
      });
      const configStoreClient = new OpenSearchConfigStoreClient(mockClient);
      await configStoreClient.deleteConfig({ name: 'some_config_name' });

      expect(mockClient.deleteByQuery).toBeCalledWith({
        index: DYNAMIC_APP_CONFIG_ALIAS,
        body: {
          query: {
            bool: {
              should: [
                {
                  terms: {
                    config_name: ['some_config_name'],
                  },
                },
              ],
            },
          },
        },
      });
    });
  });

  describe('bulkDeleteConfigs()', () => {
    it.each([
      {
        namespaces: [],
      },
      {
        namespaces: ['foo'],
      },
      {
        namespaces: ['foo', 'bar'],
      },
    ])('should call deleteByQuery() with $namespaces.length namespaces', async ({ namespaces }) => {
      const mockClient = createOpenSearchClientMock({
        isListConfig: false,
        configDocuments: [],
        existsAliasResult: false,
        catIndicesResult: oneDynamicConfigIndexResult,
        getAliasIndicesResult: validAliasIndicesResponse,
      });
      const configStoreClient = new OpenSearchConfigStoreClient(mockClient);
      await configStoreClient.bulkDeleteConfigs({
        paths: namespaces.map((name) => ({ name })),
      });

      expect(mockClient.deleteByQuery).toBeCalledWith({
        index: DYNAMIC_APP_CONFIG_ALIAS,
        body: {
          query: {
            bool: {
              should: [
                {
                  terms: {
                    config_name: namespaces,
                  },
                },
              ],
            },
          },
        },
      });
    });
  });
});
