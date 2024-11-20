/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataPublicPlugin, DataPublicPluginSetup } from '../public/plugin';
import { DataPublicPluginStart } from './types';
import { coreMock } from '../../../core/public/mocks';
import { UI_SETTINGS } from '../common';
import { of } from 'rxjs';
import { setUseNewSavedQueriesUI } from './services';
import { CoreSetup, CoreStart } from 'opensearch-dashboards/public';

jest.mock('./services');

describe('#DataPublicPlugin setup', () => {
  let coreSetup: CoreSetup;
  let coreStart: CoreStart;
  let plugin;
  let mockDataPublicPluginStart: MockedKeys<DataPublicPluginStart>;

  const expressionsMock = {
    registerFunction: jest.fn(),
    registerType: jest.fn(),
  };

  const uiActionsMock = {
    registerAction: jest.fn(),
    addTriggerAction: jest.fn(),
  };

  beforeEach(() => {
    const initializerContext = {
      config: {
        get: jest.fn().mockReturnValue({
          savedQueriesNewUI: { enabled: true },
          search: {
            aggs: {
              shardDelay: {
                enabled: true,
              },
            },
          },
          autocompleteConfig: {
            valueSuggestions: {
              enabled: true,
            },
          },
        }),
      },
    };

    plugin = new DataPublicPlugin(initializerContext);

    coreSetup = {
      ...coreMock.createSetup({ pluginStartContract: mockDataPublicPluginStart }),
      uiSettings: {
        get: jest.fn((setting) => setting === UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED),
        get$: jest.fn((setting) => of(setting === UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)),
        getUpdate$: jest.fn(() => of({ key: UI_SETTINGS.FORMAT_DEFAULT_TYPE_MAP, newValue: {} })),
      },
      expressions: expressionsMock,
      uiActions: uiActionsMock,
    };

    coreStart = coreMock.createStart();
  });

  it('should setup the plugin and set useNewSavedQueriesUI', () => {
    const setupContract = plugin.setup(coreSetup, {
      expressions: expressionsMock,
      uiActions: uiActionsMock,
      usageCollection: {},
    });

    expect(setUseNewSavedQueriesUI).toHaveBeenCalledWith(true);
  });
});
