/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { IStorageWrapper, Storage } from '../../opensearch_dashboards_utils/public';
import { ConfigSchema } from '../common/config';
import { setData, setStorage } from './services';
import { createQueryAssistExtension } from './query_assist';
import { PPLSearchInterceptor, SQLSearchInterceptor } from './search';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
  QueryEnhancementsPluginStartDependencies,
} from './types';
import { UI_SETTINGS } from '../common';
import { createEditor, DefaultInput, SingleLineInput } from '../../data/public';

export class QueryEnhancementsPlugin
  implements
    Plugin<
      QueryEnhancementsPluginSetup,
      QueryEnhancementsPluginStart,
      QueryEnhancementsPluginSetupDependencies,
      QueryEnhancementsPluginStartDependencies
    > {
  private readonly storage: IStorageWrapper;
  private readonly config: ConfigSchema;

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
    this.storage = new Storage(window.localStorage);
  }

  public setup(
    core: CoreSetup<QueryEnhancementsPluginStartDependencies>,
    { data }: QueryEnhancementsPluginSetupDependencies
  ): QueryEnhancementsPluginSetup {
    core.uiSettings.getUpdate$().subscribe(({ key, newValue }) => {
      if (key === UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED) {
        if (newValue) {
          core.uiSettings.set(UI_SETTINGS.STATE_STORE_IN_SESSION_STORAGE, true);
        }
      }
      if (key === UI_SETTINGS.STATE_STORE_IN_SESSION_STORAGE) {
        if (!newValue) {
          core.uiSettings.set(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED, false);
        }
      }
    });

    const pplSearchInterceptor = new PPLSearchInterceptor({
      toasts: core.notifications.toasts,
      http: core.http,
      uiSettings: core.uiSettings,
      startServices: core.getStartServices(),
      usageCollector: data.search.usageCollector,
    });

    const sqlSearchInterceptor = new SQLSearchInterceptor({
      toasts: core.notifications.toasts,
      http: core.http,
      uiSettings: core.uiSettings,
      startServices: core.getStartServices(),
      usageCollector: data.search.usageCollector,
    });

    const enhancedQueryEditor = createEditor(SingleLineInput, null, DefaultInput);

    data.__enhance({
      ui: {
        query: {
          language: 'PPL',
          search: pplSearchInterceptor,
          editor: enhancedQueryEditor,
          meta: {
            queryStringInput: { initialValue: 'source=<data_source>' },
          },
          fields: {
            visualizable: false,
          },
          supportedAppNames: ['discover'],
        },
      },
    });

    data.__enhance({
      ui: {
        query: {
          language: 'SQL',
          search: sqlSearchInterceptor,
          editor: enhancedQueryEditor,
          meta: {
            queryStringInput: { initialValue: 'SELECT * FROM <data_source> LIMIT 10' },
          },
          fields: {
            visualizable: false,
          },
          supportedAppNames: ['discover'],
        },
      },
    });

    data.__enhance({
      ui: {
        queryEditorExtension: createQueryAssistExtension(core.http, data, this.config.queryAssist),
      },
    });

    return {};
  }

  public start(
    core: CoreStart,
    deps: QueryEnhancementsPluginStartDependencies
  ): QueryEnhancementsPluginStart {
    setStorage(this.storage);
    setData(deps.data);
    return {};
  }

  public stop() {}
}
