/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicConfigService, IDynamicConfigService } from './dynamic_config_service';
import { configServiceMock, httpServiceMock, opensearchServiceMock } from '../mocks';
import { loggerMock } from '../logging/logger.mock';
import { LoggerFactory } from '@osd/logging';
import { schema, Type } from '@osd/config-schema';
import { IDynamicConfigStoreClient } from 'opensearch-dashboards/server';

describe('DynamicConfigService', () => {
  let dynamicConfigService: IDynamicConfigService;
  const openSearchMock = opensearchServiceMock.createStart();

  beforeEach(() => {
    const loggerFactoryMock = {} as LoggerFactory;
    loggerFactoryMock.get = jest.fn().mockReturnValue(loggerMock.create());

    dynamicConfigService = new DynamicConfigService(
      configServiceMock.create(),
      {} as any,
      loggerFactoryMock
    );
  });

  it('setup() and start() should return the same clients/async local stores', async () => {
    const dynamicConfigServiceSetup = await dynamicConfigService.setup();
    expect(dynamicConfigServiceSetup.getStartService()).toBeDefined();
    expect(dynamicConfigServiceSetup.registerDynamicConfigClientFactory).toBeDefined();
    expect(dynamicConfigServiceSetup.registerAsyncLocalStoreRequestHeader).toBeDefined();

    dynamicConfigServiceSetup.registerDynamicConfigClientFactory({
      create: () => {
        return {} as IDynamicConfigStoreClient;
      },
    });

    const dynamicConfigServiceStart = await dynamicConfigService.start({
      opensearch: openSearchMock,
    });
    expect(dynamicConfigServiceStart.getAsyncLocalStore).toBeDefined();
    expect(dynamicConfigServiceStart.getClient()).toBeDefined();

    const actualGetStartServices = await dynamicConfigServiceSetup.getStartService();

    expect(actualGetStartServices.getClient()).toMatchObject(dynamicConfigServiceStart.getClient());
    expect(actualGetStartServices.getAsyncLocalStore).toBeDefined();
  });

  describe('After http is setup', () => {
    it('setupHTTP() should add the async local store preAuth middleware', () => {
      const httpSetupMock = httpServiceMock.createInternalSetupContract();
      dynamicConfigService.registerRoutesAndHandlers({ http: httpSetupMock });
      expect(httpSetupMock.registerOnPostAuth).toHaveBeenCalled();
    });
  });

  it('setSchema() and hasDefaultConfigs() should set and check if schemas have been registered', () => {
    const schemaList: Map<string, Type<unknown>> = new Map();

    schemaList.set(
      'foo',
      schema.object({
        a: schema.boolean(),
        b: schema.object({
          c: schema.string(),
        }),
      })
    );
    schemaList.set(
      'bar',
      schema.object({
        a: schema.boolean(),
        b: schema.boolean(),
        c: schema.object({
          d: schema.string(),
        }),
      })
    );
    schemaList.set(
      'baz',
      schema.object({
        a: schema.object({
          c: schema.object({
            d: schema.boolean(),
          }),
        }),
      })
    );

    schemaList.forEach((value, key) => {
      dynamicConfigService.setSchema(key, value);
    });

    [...schemaList.keys()].forEach((key) => {
      expect(dynamicConfigService.hasDefaultConfigs({ name: key })).toBe(true);
    });

    expect(dynamicConfigService.hasDefaultConfigs({ name: 'nonexistent_config' })).toBe(false);
  });
});
