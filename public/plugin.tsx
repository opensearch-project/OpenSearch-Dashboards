/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../src/core/public';
import { IStorageWrapper, Storage } from '../../../src/plugins/opensearch_dashboards_utils/public';
import { ConfigSchema } from '../common/config';
import { createQueryAssistExtension } from './query_assist';
import { PPLSearchInterceptor, SQLSearchInterceptor, SQLAsyncSearchInterceptor } from './search';
import { setData, setStorage } from './services';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
  QueryEnhancementsPluginStartDependencies,
} from './types';

export type PublicConfig = Pick<ConfigSchema, 'queryAssist'>;

export class QueryEnhancementsPlugin
  implements Plugin<QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart> {
  private readonly storage: IStorageWrapper;
  private readonly config: PublicConfig;

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<PublicConfig>();
    this.storage = new Storage(window.localStorage);
  }

  public setup(
    core: CoreSetup,
    { data }: QueryEnhancementsPluginSetupDependencies
  ): QueryEnhancementsPluginSetup {
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

    const sqlAsyncSearchInterceptor = new SQLAsyncSearchInterceptor({
      toasts: core.notifications.toasts,
      http: core.http,
      uiSettings: core.uiSettings,
      startServices: core.getStartServices(),
      usageCollector: data.search.usageCollector,
    });

    data.__enhance({
      ui: {
        query: {
          language: 'PPL',
          search: pplSearchInterceptor,
          searchBar: {
            queryStringInput: { initialValue: 'source=<data_source>' },
            dateRange: {
              initialFrom: moment().subtract(2, 'days').toISOString(),
              initialTo: moment().add(2, 'days').toISOString(),
            },
            showFilterBar: false,
            showDataSourceSelector: false,
          },
          fields: {
            filterable: false,
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
          searchBar: {
            showDatePicker: false,
            showFilterBar: false,
            showDataSourceSelector: false,
            queryStringInput: { initialValue: 'SELECT * FROM <data_source>' },
          },
          fields: {
            filterable: false,
            visualizable: false,
          },
          showDocLinks: false,
          supportedAppNames: ['discover'],
        },
      },
    });

    data.__enhance({
      ui: {
        query: {
          language: 'SQLAsync',
          search: sqlAsyncSearchInterceptor,
          searchBar: {
            showDatePicker: false,
            showFilterBar: false,
            showDataSourceSelector: false,
            queryStringInput: { initialValue: '' },
          },
          fields: {
            filterable: false,
            visualizable: false,
          },
          showDocLinks: false,
          supportedAppNames: ['discover'],
        },
      },
    });

    data.__enhance({
      ui: {
        queryEditorExtension: createQueryAssistExtension(core.http, this.config),
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
