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
import { LanguageConfig, Query } from '../../data/public';
import { s3TypeConfig } from './datasets';
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
    const { queryString } = data.query;
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

    // Register PPL language
    const pplLanguageConfig: LanguageConfig = {
      id: 'PPL',
      title: 'PPL',
      search: pplSearchInterceptor,
      getQueryString: (query: Query) => {
        return `source = ${query.dataset?.title}`;
      },
      fields: {
        filterable: false,
        visualizable: false,
      },
      showDocLinks: false,
      editor: enhancedQueryEditor,
      editorSupportedAppNames: ['discover'],
    };
    queryString.getLanguageService().registerLanguage(pplLanguageConfig);

    // Register SQL language
    const sqlLanguageConfig: LanguageConfig = {
      id: 'SQL',
      title: 'SQL',
      search: sqlSearchInterceptor,
      getQueryString: (query: Query) => {
        return `SELECT * FROM ${queryString.getQuery().dataset?.title} LIMIT 10`;
      },
      fields: {
        filterable: false,
        visualizable: false,
      },
      showDocLinks: false,
      editor: enhancedQueryEditor,
      editorSupportedAppNames: ['discover'],
    };
    queryString.getLanguageService().registerLanguage(sqlLanguageConfig);

    data.__enhance({
      ui: {
        queryEditorExtension: createQueryAssistExtension(core.http, data, this.config.queryAssist),
      },
    });

    queryString.getDatasetService().registerType(s3TypeConfig);

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
