import moment from 'moment';
import { CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { IStorageWrapper, Storage } from '../../../src/plugins/opensearch_dashboards_utils/public';
import { createQueryAssistExtension } from './query_assist';
import { PPLQlSearchInterceptor } from './search/ppl_search_interceptor';
import { SQLQlSearchInterceptor } from './search/sql_search_interceptor';
import { setData, setStorage } from './services';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
  QueryEnhancementsPluginStartDependencies,
} from './types';

export class QueryEnhancementsPlugin
  implements Plugin<QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart> {
  private readonly storage: IStorageWrapper;

  constructor() {
    this.storage = new Storage(window.localStorage);
  }

  public setup(
    core: CoreSetup,
    { data }: QueryEnhancementsPluginSetupDependencies
  ): QueryEnhancementsPluginSetup {
    const pplSearchInterceptor = new PPLQlSearchInterceptor({
      toasts: core.notifications.toasts,
      http: core.http,
      uiSettings: core.uiSettings,
      startServices: core.getStartServices(),
      usageCollector: data.search.usageCollector,
    });

    const sqlSearchInterceptor = new SQLQlSearchInterceptor({
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
            extensions: [createQueryAssistExtension(core.http)],
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
          searchBar: {
            showDatePicker: false,
            showFilterBar: false,
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
