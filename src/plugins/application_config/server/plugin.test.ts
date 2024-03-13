/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { ApplicationConfigPlugin } from './plugin';
import { ConfigurationClient } from './types';

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

    const setup = await plugin.setup(coreSetup);

    const client1: ConfigurationClient = {
      getConfig: jest.fn(),
      getEntityConfig: jest.fn(),
      updateEntityConfig: jest.fn(),
      deleteEntityConfig: jest.fn(),
    };

    setup.registerConfigurationClient(client1);

    const scopedClient = {};
    expect(setup.getConfigurationClient(scopedClient)).toBe(client1);

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

    expect(setup.getConfigurationClient(scopedClient)).toBe(client1);
  });
});
