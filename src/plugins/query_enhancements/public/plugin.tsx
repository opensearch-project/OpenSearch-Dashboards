/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { IStorageWrapper, Storage } from '../../opensearch_dashboards_utils/public';
import { ConfigSchema } from '../common/config';
import { ConnectionsService, setData, setStorage } from './services';
import { createQueryAssistExtension } from './query_assist';
import { PPLSearchInterceptor, SQLAsyncSearchInterceptor, SQLSearchInterceptor } from './search';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
  QueryEnhancementsPluginStartDependencies,
} from './types';

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
  private connectionsService!: ConnectionsService;

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
    this.storage = new Storage(window.localStorage);
  }

  public setup(
    core: CoreSetup<QueryEnhancementsPluginStartDependencies>,
    { data }: QueryEnhancementsPluginSetupDependencies
  ): QueryEnhancementsPluginSetup {
    this.connectionsService = new ConnectionsService({
      startServices: core.getStartServices(),
      http: core.http,
    });

    const pplSearchInterceptor = new PPLSearchInterceptor(
      {
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
      },
      this.connectionsService
    );

    const sqlSearchInterceptor = new SQLSearchInterceptor(
      {
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
      },
      this.connectionsService
    );

    const sqlAsyncSearchInterceptor = new SQLAsyncSearchInterceptor(
      {
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
      },
      this.connectionsService
    );

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
            showDataSetsSelector: true,
            showDataSourcesSelector: true,
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
            showDataSetsSelector: true,
            showDataSourcesSelector: true,
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
            showDataSetsSelector: false,
            showDataSourcesSelector: true,
            queryStringInput: { initialValue: 'SHOW DATABASES IN ::mys3::' },
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
        queryEditorExtension: createQueryAssistExtension(
          core.http,
          this.connectionsService,
          this.config.queryAssist
        ),
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
