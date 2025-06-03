/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { configMock, configServiceMock } from '../mocks';
import { InternalDynamicConfigurationClient } from './internal_dynamic_configuration_client';
import { loggerMock } from '../../logging/logger.mock';
import { Env } from '@osd/config';
import _ from 'lodash';
import { schema, Type } from '@osd/config-schema';
import { IDynamicConfigStoreClient } from 'opensearch-dashboards/server';
import { ApiResponse } from '@opensearch-project/opensearch/.';

describe('InternalDynamicConfigStoreClient', () => {
  const existingConfigServiceMock = configServiceMock.create();

  interface CreateConfigStoreClientMockProps {
    getConfigReturnValue?: Record<string, any>;
    bulkGetConfigsReturnValue?: Map<string, Record<string, any>>;
    listConfigsReturnValue?: Map<string, Record<string, any>>;
    createConfigReturnValue?: ApiResponse<string>;
    bulkCreateConfigsReturnValue?: ApiResponse<string>;
    deleteConfigReturnValue?: ApiResponse<string>;
    bulkDeleteConfigsReturnValue?: ApiResponse<string>;
  }

  const createConfigStoreClientMock = ({
    getConfigReturnValue,
    bulkGetConfigsReturnValue,
    listConfigsReturnValue,
    createConfigReturnValue,
    bulkCreateConfigsReturnValue,
    deleteConfigReturnValue,
    bulkDeleteConfigsReturnValue,
  }: CreateConfigStoreClientMockProps): IDynamicConfigStoreClient => {
    return {
      getConfig: jest.fn().mockResolvedValue(getConfigReturnValue),
      bulkGetConfigs: jest.fn().mockResolvedValue(bulkGetConfigsReturnValue),
      listConfigs: jest.fn().mockResolvedValue(listConfigsReturnValue),
      createConfig: jest.fn().mockResolvedValue(createConfigReturnValue),
      bulkCreateConfigs: jest.fn().mockResolvedValue(bulkCreateConfigsReturnValue),
      deleteConfig: jest.fn().mockResolvedValue(deleteConfigReturnValue),
      bulkDeleteConfigs: jest.fn().mockResolvedValue(bulkDeleteConfigsReturnValue),
    };
  };

  beforeEach(() => {
    existingConfigServiceMock.atPath = jest.fn().mockImplementation((namespace) => {});
    existingConfigServiceMock.getConfig$ = jest.fn().mockReturnValue({});
  });

  describe('getConfig()', () => {
    interface GetConfigTestCaseFormat {
      configName: string;
      oldConfig: Record<string, any>;
      expectedConfig: Record<string, any>;
      dynamicConfigStoreMockResponse: Record<string, any>;
      schemaStructure: Type<unknown>;
    }

    it('should throw an error for a non-existent config name', async () => {
      const dynamicConfigStoreClient = createConfigStoreClientMock({ getConfigReturnValue: {} });

      const internalClient = new InternalDynamicConfigurationClient({
        client: dynamicConfigStoreClient,
        configService: configServiceMock.create(),
        env: {} as Env,
        logger: loggerMock.create(),
        schemas: new Map(),
      });

      const name = 'non_existent_name';
      await expect(internalClient.getConfig({ name })).rejects.toThrow(
        `schema for ${name} not found`
      );
    });

    it.each<GetConfigTestCaseFormat>([
      {
        configName: 'somePlugin',
        oldConfig: {
          a: 'foo',
          b: 'old',
          c: {
            d: 2,
          },
        },
        expectedConfig: {
          a: 'foo',
          b: 'bar',
          c: {
            d: 4,
          },
        },
        dynamicConfigStoreMockResponse: {
          b: 'bar',
          c: {
            d: 4,
          },
        },
        schemaStructure: schema.object({
          a: schema.string(),
          b: schema.string(),
          c: schema.object({
            d: schema.number(),
          }),
        }),
      },
      {
        configName: 'somePluginWithNoCustomerConfigs',
        oldConfig: {
          a: 'foo',
          b: {
            c: {
              d: true,
            },
          },
        },
        expectedConfig: {
          a: 'foo',
          b: {
            c: {
              d: true,
            },
          },
        },
        dynamicConfigStoreMockResponse: {},
        schemaStructure: schema.object({
          a: schema.string(),
          b: schema.object({
            c: schema.object({
              d: schema.boolean(),
            }),
          }),
        }),
      },
    ])(
      '$configName should merge configs from DDB and old config service',
      async ({
        configName,
        oldConfig,
        expectedConfig,
        dynamicConfigStoreMockResponse,
        schemaStructure,
      }) => {
        const schemas = new Map([[_.snakeCase(configName), schemaStructure]]);

        const dynamicConfigStoreClient = createConfigStoreClientMock({
          getConfigReturnValue: dynamicConfigStoreMockResponse,
        });

        const mockedObservable = of(oldConfig);
        const configService = configServiceMock.create();
        configService.atPath = jest.fn().mockReturnValue(mockedObservable);

        const internalClient = new InternalDynamicConfigurationClient({
          client: dynamicConfigStoreClient as any,
          configService,
          env: {} as Env,
          logger: loggerMock.create(),
          schemas,
        });

        const actualConfigResponse = await internalClient.getConfig({ name: configName });

        expect(_.isEqual(actualConfigResponse, expectedConfig)).toBe(true);
      }
    );
  });

  describe('bulkGetConfigs()', () => {
    interface ConfigListItem {
      configName: string;
      oldConfig: Record<string, any>;
      dynamicConfigStoreMockResponse: Record<string, any>;
      schemaStructure: Type<unknown>;
    }
    interface BulkGetConfigTestCaseFormat {
      configsList: ConfigListItem[];
      expectedConfigs: Map<string, Record<string, any>>;
    }

    interface BulkGetConfigNonExistentTestCaseFormat {
      configsList: ConfigListItem[];
      nonExistentConfigs: string[];
    }

    it.each<BulkGetConfigNonExistentTestCaseFormat>([
      {
        configsList: [],
        nonExistentConfigs: ['foo'],
      },
      {
        configsList: [],
        nonExistentConfigs: ['foo', 'bar'],
      },
      {
        configsList: [
          {
            configName: 'foo',
            oldConfig: {
              a: 13,
              b: {
                c: true,
              },
            },
            dynamicConfigStoreMockResponse: {
              b: {
                c: false,
              },
            },
            schemaStructure: schema.object({
              a: schema.number(),
              b: schema.object({
                c: schema.boolean(),
              }),
            }),
          },
        ],
        nonExistentConfigs: ['foo', 'bar'],
      },
    ])(
      'should fail when the configs $nonExistentConfigs are attempted to be called',
      async ({ configsList, nonExistentConfigs }) => {
        const schemas = new Map();
        const dynamicConfigStoreMockResponses = new Map();
        const mockedObservableMap = new Map();

        configsList.forEach((configItem) => {
          const processedConfigName = _.snakeCase(configItem.configName);
          schemas.set(processedConfigName, configItem.schemaStructure);
          dynamicConfigStoreMockResponses.set(
            processedConfigName,
            configItem.dynamicConfigStoreMockResponse
          );
          mockedObservableMap.set(processedConfigName, of(configItem.oldConfig));
        });

        const dynamicConfigStoreClient = createConfigStoreClientMock({
          bulkGetConfigsReturnValue: dynamicConfigStoreMockResponses,
        });

        const configService = configServiceMock.create();
        configService.atPath = jest.fn().mockImplementation((namespace: string) => {
          if (!mockedObservableMap.has(namespace)) {
            throw new Error(`${namespace} is not defined/found in the mockedObservableMap`);
          }
          return mockedObservableMap.get(namespace);
        });

        const internalClient = new InternalDynamicConfigurationClient({
          client: dynamicConfigStoreClient as any,
          configService,
          env: {} as Env,
          logger: loggerMock.create(),
          schemas,
        });

        const paths = nonExistentConfigs.map((configName: string) => {
          return { name: configName };
        });

        await expect(internalClient.bulkGetConfigs({ paths })).rejects.toThrow(/schema for/);
      }
    );

    it.each<BulkGetConfigTestCaseFormat>([
      {
        configsList: [
          {
            configName: 'foo',
            oldConfig: {
              a: 'value',
              b: true,
              c: {
                d: {
                  e: 1,
                },
              },
            },
            dynamicConfigStoreMockResponse: {
              c: {
                d: {
                  e: 536,
                },
              },
            },
            schemaStructure: schema.object({
              a: schema.string(),
              b: schema.boolean(),
              c: schema.object({
                d: schema.object({
                  e: schema.number(),
                }),
              }),
            }),
          },
        ],
        expectedConfigs: new Map([
          [
            'foo',
            {
              a: 'value',
              b: true,
              c: {
                d: {
                  e: 536,
                },
              },
            },
          ],
        ]),
      },
      {
        configsList: [
          {
            configName: 'foo',
            oldConfig: {
              a: 'value',
              b: true,
              c: {
                d: {
                  e: 1,
                },
              },
            },
            dynamicConfigStoreMockResponse: {
              c: {
                d: {
                  e: 536,
                },
              },
            },
            schemaStructure: schema.object({
              a: schema.string(),
              b: schema.boolean(),
              c: schema.object({
                d: schema.object({
                  e: schema.number(),
                }),
              }),
            }),
          },
          {
            configName: 'bar',
            oldConfig: {
              a: '13',
              b: 13,
              c: {
                d: true,
              },
            },
            dynamicConfigStoreMockResponse: {
              a: '24561',
            },
            schemaStructure: schema.object({
              a: schema.string(),
              b: schema.number(),
              c: schema.object({
                d: schema.boolean(),
              }),
            }),
          },
          {
            configName: 'baz',
            oldConfig: {
              a: {
                b: true,
              },
              c: 'someString',
            },
            dynamicConfigStoreMockResponse: {},
            schemaStructure: schema.object({
              a: schema.object({
                b: schema.boolean(),
              }),
              c: schema.string(),
            }),
          },
        ],
        expectedConfigs: new Map([
          [
            'foo',
            {
              a: 'value',
              b: true,
              c: {
                d: {
                  e: 536,
                },
              },
            },
          ],
          [
            'bar',
            {
              a: '24561',
              b: 13,
              c: {
                d: true,
              },
            },
          ],
          [
            'baz',
            {
              a: {
                b: true,
              },
              c: 'someString',
            },
          ],
        ]),
      },
    ])(
      'should merge configs for one or many requested configs',
      async ({ configsList, expectedConfigs }) => {
        const schemas = new Map();
        const dynamicConfigStoreMockResponses = new Map();
        const mockedObservableMap = new Map();

        configsList.forEach((configItem) => {
          const processedConfigName = _.snakeCase(configItem.configName);
          schemas.set(processedConfigName, configItem.schemaStructure);
          dynamicConfigStoreMockResponses.set(
            processedConfigName,
            configItem.dynamicConfigStoreMockResponse
          );
          mockedObservableMap.set(processedConfigName, of(configItem.oldConfig));
        });

        const dynamicConfigStoreClient = createConfigStoreClientMock({
          bulkGetConfigsReturnValue: dynamicConfigStoreMockResponses,
        });

        const configService = configServiceMock.create();
        configService.atPath = jest.fn().mockImplementation((namespace: string) => {
          if (!mockedObservableMap.has(namespace)) {
            throw new Error(`${namespace} is not defined/found in the mockedObservableMap`);
          }
          return mockedObservableMap.get(namespace);
        });

        const internalClient = new InternalDynamicConfigurationClient({
          client: dynamicConfigStoreClient as any,
          configService,
          env: {} as Env,
          logger: loggerMock.create(),
          schemas,
        });

        const paths = configsList.map((configItem) => {
          return { name: configItem.configName };
        });

        const actualResponse = await internalClient.bulkGetConfigs({ paths });

        expect(actualResponse.size).toBe(expectedConfigs.size);
        for (const [key, value] of expectedConfigs) {
          expect(actualResponse.has(key)).toBe(true);
          expect(_.isEqual(actualResponse.get(key), value)).toBe(true);
        }
      }
    );
  });

  describe('listConfigs()', () => {
    interface ListConfigsTestCaseFormat {
      oldConfigs: Map<string, Record<string, any>>;
      dynamicConfigStoreMockResponse: Map<string, Record<string, any>>;
      expectedConfigs: Map<string, Record<string, any>>;
    }

    it.each<ListConfigsTestCaseFormat>([
      {
        oldConfigs: new Map([
          [
            'foo',
            {
              a: true,
              b: 1,
              c: {
                d: '143',
              },
            },
          ],
        ]),
        dynamicConfigStoreMockResponse: new Map(),
        expectedConfigs: new Map(),
      },
      {
        oldConfigs: new Map([
          [
            'foo',
            {
              key1: 'value1',
              key2: {
                subKey1: 123,
                subKey2: true,
                subKey3: ['a', 'b', 'c'],
              },
              key3: {
                subKey4: '',
                subKey5: {
                  subSubKey1: false,
                  subSubKey2: 0,
                },
              },
            },
          ],
          [
            'bar',
            {
              key1: 'value1',
              key2: {
                subKey1: 42,
                subKey2: true,
                subKey3: ['x', 'y', 'z'],
              },
              key3: {
                subKey4: 'abc',
                subKey5: {
                  subSubKey1: false,
                  subSubKey2: -10,
                },
              },
            },
          ],
        ]),
        dynamicConfigStoreMockResponse: new Map([
          [
            'foo',
            {
              key1: 'value3',
              key2: {
                subKey2: false,
                subKey3: ['b', 'c'],
              },
              key3: {
                subKey5: {
                  subSubKey1: true,
                },
              },
            },
          ],
        ]),
        expectedConfigs: new Map([
          [
            'foo',
            {
              key1: 'value3',
              key2: {
                subKey2: false,
                subKey3: ['b', 'c'],
              },
              key3: {
                subKey5: {
                  subSubKey1: true,
                },
              },
            },
          ],
        ]),
      },
      {
        oldConfigs: new Map([
          [
            'foo',
            {
              a: 'John',
              b: 30,
              c: true,
              d: ['reading', 'painting'],
              e: {
                f: 'New York',
                g: 10001,
                h: {
                  i: 40.7128,
                  j: -74.006,
                },
              },
            },
          ],
          [
            'bar',
            {
              key1: 'value1',
              key2: {
                subKey1: 3.14,
                subKey2: true,
                subKey3: ['a', 'b', 'c'],
              },
              key3: {
                subKey4: 'hello',
                subKey5: {
                  subSubKey1: false,
                  subSubKey2: 0,
                },
              },
            },
          ],
          [
            'baz',
            {
              a: {
                a1: 'Smartphone',
                a2: 'ABC',
                a3: 599.99,
                a4: true,
                a5: {
                  aa1: {
                    aaa1: '6.5 inches',
                    aaa2: 'AMOLED',
                  },
                  aa2: {
                    aab1: '12 MP',
                    aab2: ['HDR', 'Night Mode'],
                  },
                },
              },
              b: {
                b1: 'XYZ Electronics',
                b2: 4.7,
                b3: {
                  bb1: 'Los Angeles',
                  bb2: 'California',
                },
              },
            },
          ],
        ]),
        dynamicConfigStoreMockResponse: new Map([
          [
            'foo',
            {
              c: true,
              d: ['reading', 'running', 'drawing'],
              e: {
                h: {
                  j: -13.01,
                },
              },
            },
          ],
          [
            'baz',
            {
              a: {
                a5: {
                  aa1: {
                    aaa2: 'LED',
                  },
                },
              },
              b: {
                b1: 'ABC Corp',
                b3: {
                  bb1: 'San Francisco',
                  bb2: 'California',
                },
              },
            },
          ],
        ]),
        expectedConfigs: new Map([
          [
            'foo',
            {
              c: true,
              d: ['reading', 'running', 'drawing'],
              e: {
                h: {
                  j: -13.01,
                },
              },
            },
          ],
          [
            'baz',
            {
              a: {
                a5: {
                  aa1: {
                    aaa2: 'LED',
                  },
                },
              },
              b: {
                b1: 'ABC Corp',
                b3: {
                  bb1: 'San Francisco',
                  bb2: 'California',
                },
              },
            },
          ],
        ]),
      },
    ])(
      'should merge configs when 0, 1, or multiple customer configs are present',
      async ({ oldConfigs, dynamicConfigStoreMockResponse, expectedConfigs }) => {
        const configStoreMock = configMock.create();
        configStoreMock.get = jest.fn().mockImplementation((configName: string) => {
          if (!oldConfigs.has(configName)) {
            throw new Error(`${configName} not found/defined in oldConfigs`);
          }

          return oldConfigs.get(configName);
        });
        const configService = configServiceMock.create();
        configService.getConfig$ = jest.fn().mockReturnValue(configStoreMock);

        const schemas = new Map();
        oldConfigs.forEach((value, key) => {
          const processedConfigName = _.snakeCase(key);
          // Since schemas values will not be used, the value is stubbed
          schemas.set(processedConfigName, {});
        });

        const dynamicConfigStoreClient = createConfigStoreClientMock({
          listConfigsReturnValue: dynamicConfigStoreMockResponse,
        });

        const internalClient = new InternalDynamicConfigurationClient({
          client: dynamicConfigStoreClient as any,
          configService,
          env: {} as Env,
          logger: loggerMock.create(),
          schemas,
        });

        const actualResponse = await internalClient.listConfigs();

        expect(actualResponse.size).toBe(expectedConfigs.size);
        for (const [key, value] of expectedConfigs) {
          expect(actualResponse.has(key)).toBe(true);
          expect(_.isEqual(actualResponse.get(key), value)).toBe(true);
        }
      }
    );
  });
});
