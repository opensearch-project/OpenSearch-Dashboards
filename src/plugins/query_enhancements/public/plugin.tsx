/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
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
import { DataStorage } from '../../data/common';
import { pplLanguageReference, sqlLanguageReference } from './query_editor_extensions';

export class QueryEnhancementsPlugin
  implements
    Plugin<
      QueryEnhancementsPluginSetup,
      QueryEnhancementsPluginStart,
      QueryEnhancementsPluginSetupDependencies,
      QueryEnhancementsPluginStartDependencies
    > {
  private readonly storage: DataStorage;
  private readonly config: ConfigSchema;

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
    this.storage = new DataStorage(window.localStorage, 'discover.queryAssist.');
  }

  public setup(
    core: CoreSetup<QueryEnhancementsPluginStartDependencies>,
    { data, usageCollection }: QueryEnhancementsPluginSetupDependencies
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

    const pplControls = [pplLanguageReference()];
    const sqlControls = [sqlLanguageReference()];

    const enhancedPPLQueryEditor = createEditor(SingleLineInput, null, pplControls, DefaultInput);

    const enhancedSQLQueryEditor = createEditor(SingleLineInput, null, sqlControls, DefaultInput);

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
      editor: enhancedPPLQueryEditor,
      editorSupportedAppNames: ['discover'],
      supportedAppNames: ['discover', 'data-explorer'],
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
      editor: enhancedSQLQueryEditor,
      editorSupportedAppNames: ['discover'],
      supportedAppNames: ['discover', 'data-explorer'],
      hideDatePicker: true,
    };
    queryString.getLanguageService().registerLanguage(sqlLanguageConfig);

    data.__enhance({
      editor: {
        queryEditorExtension: createQueryAssistExtension(
          core,
          data,
          this.config.queryAssist,
          usageCollection
        ),
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
