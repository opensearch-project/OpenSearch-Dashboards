/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { ApplicationConfigPlugin } from './plugin';
import { ConfigurationClient } from './types';
import LRUCache from 'lru-cache';
import { OpenSearchConfigurationClient } from './opensearch_config_client';

jest.mock('lru-cache');
jest.mock('./opensearch_config_client');

describe('application config plugin', () => {
  it('throws error when trying to register twice', async () => {
    const initializerContext = {
      logger: {
        get: jest.fn().mockImplementation(() => {
          return {
            info: jest.fn(),
            error: jest.fn(),
          };
        }),
      },
      config: {
        legacy: {
          globalConfig$: of({
            opensearchDashboards: {
              configIndex: '.osd_test',
            },
          }),
        },
      },
    };

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const plugin = new ApplicationConfigPlugin(initializerContext);

    const coreSetup = {
      http: {
        createRouter: jest.fn().mockImplementation(() => {
          return {
            get: jest.fn(),
            post: jest.fn(),
            delete: jest.fn(),
          };
        }),
      },
    };

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const setup = await plugin.setup(coreSetup);

    const client1: ConfigurationClient = {
      getConfig: jest.fn(),
      getEntityConfig: jest.fn(),
      updateEntityConfig: jest.fn(),
      deleteEntityConfig: jest.fn(),
    };

    setup.registerConfigurationClient(client1);

    const request = {};
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    expect(setup.getConfigurationClient(request)).toBe(client1);

    const client2: ConfigurationClient = {
      getConfig: jest.fn(),
      getEntityConfig: jest.fn(),
      updateEntityConfig: jest.fn(),
      deleteEntityConfig: jest.fn(),
    };

    // call the register function again
    const secondCall = () => setup.registerConfigurationClient(client2);

    expect(secondCall).toThrowError(
      'Configuration client is already registered! Cannot register again!'
    );

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    expect(setup.getConfigurationClient(request)).toBe(client1);
  });

  it('getConfigurationClient returns opensearch client when no external registration', async () => {
    // @ts-expect-error TS7034 TODO(ts-error): fixme
    let capturedLRUCacheConstructorArgs = [];

    const cache = {
      get: jest.fn(),
    };

    // @ts-expect-error TS2339, TS7019 TODO(ts-error): fixme
    LRUCache.mockImplementation(function (...args) {
      capturedLRUCacheConstructorArgs = args;
      return cache;
    });

    // @ts-expect-error TS7034 TODO(ts-error): fixme
    let capturedConfigurationClientConstructorArgs = [];

    const client: ConfigurationClient = {
      getConfig: jest.fn(),
      getEntityConfig: jest.fn(),
      updateEntityConfig: jest.fn(),
      deleteEntityConfig: jest.fn(),
    };

    // @ts-expect-error TS2339, TS7019 TODO(ts-error): fixme
    OpenSearchConfigurationClient.mockImplementation(function (...args) {
      capturedConfigurationClientConstructorArgs = args;
      return client;
    });

    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const initializerContext = {
      logger: {
        get: jest.fn().mockReturnValue(logger),
      },
      config: {
        legacy: {
          globalConfig$: of({
            opensearchDashboards: {
              configIndex: '.osd_test',
            },
          }),
        },
      },
    };

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const plugin = new ApplicationConfigPlugin(initializerContext);

    const coreSetup = {
      http: {
        createRouter: jest.fn().mockImplementation(() => {
          return {
            get: jest.fn(),
            post: jest.fn(),
            delete: jest.fn(),
          };
        }),
      },
    };

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const setup = await plugin.setup(coreSetup);

    const scopedClient = {
      asCurrentUser: jest.fn(),
    };

    const coreStart = {
      opensearch: {
        client: {
          asScoped: jest.fn().mockReturnValue(scopedClient),
        },
      },
    };

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    await plugin.start(coreStart);

    const request = {};

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    expect(setup.getConfigurationClient(request)).toBe(client);

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(capturedLRUCacheConstructorArgs).toEqual([
      {
        max: 100,
        maxAge: 600000,
      },
    ]);

    // @ts-expect-error TS7005 TODO(ts-error): fixme
    expect(capturedConfigurationClientConstructorArgs).toEqual([
      scopedClient,
      '.osd_test',
      logger,
      cache,
    ]);

    expect(coreStart.opensearch.client.asScoped).toBeCalledTimes(1);
  });
});
