/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { Trigger } from 'src/plugins/ui_actions/public';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { IStorageWrapper, Storage } from '../../opensearch_dashboards_utils/public';
import { ConfigSchema } from '../common/config';
import { ConnectionsService, createDataSourceConnectionExtension } from './data_source_connection';
import { createQueryAssistExtension } from './query_assist';
import { PPLSearchInterceptor, SQLAsyncSearchInterceptor, SQLSearchInterceptor } from './search';
import { setData, setStorage } from './services';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
  QueryEnhancementsPluginStartDependencies,
} from './types';
import { ASYNC_TRIGGER_ID } from '../common';

export type PublicConfig = Pick<ConfigSchema, 'queryAssist'>;

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
    { data, uiActions }: QueryEnhancementsPluginSetupDependencies
  ): QueryEnhancementsPluginSetup {
    this.connectionsService = new ConnectionsService({
      startServices: core.getStartServices(),
      http: core.http,
      uiActions,
    });

    const pplSearchInterceptor = new PPLSearchInterceptor(
      {
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
        uiActions,
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
        uiActions,
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
        uiActions,
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
            showDataSetsSelector: false,
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
          language: 'PPLAsync',
          search: sqlAsyncSearchInterceptor,
          searchBar: {
            showDatePicker: false,
            showFilterBar: false,
            showDataSetsSelector: false,
            showDataSourcesSelector: true,
            queryStringInput: { initialValue: 'source = mys3.default.http_logs' },
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
          language: 'SQL',
          search: sqlSearchInterceptor,
          searchBar: {
            showDatePicker: false,
            showFilterBar: false,
            showDataSetsSelector: false,
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

    data.__enhance({
      ui: {
        queryEditorExtension: createDataSourceConnectionExtension(
          this.connectionsService,
          core.notifications.toasts,
          this.config
        ),
      },
    });

    const ASYNC_TRIGGER: Trigger<typeof ASYNC_TRIGGER_ID> = {
      id: ASYNC_TRIGGER_ID,
    };
    uiActions.registerTrigger(ASYNC_TRIGGER);

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
