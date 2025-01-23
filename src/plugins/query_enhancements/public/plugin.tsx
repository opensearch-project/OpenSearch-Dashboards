/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { BehaviorSubject } from 'rxjs';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { DataStorage } from '../../data/common';
import {
  createEditor,
  DefaultInput,
  LanguageConfig,
  Query,
  SingleLineInput,
} from '../../data/public';
import { ConfigSchema } from '../common/config';
import { s3TypeConfig } from './datasets';
import { createQueryAssistExtension } from './query_assist';
import { pplLanguageReference, sqlLanguageReference } from './query_editor_extensions';
import { PPLSearchInterceptor, SQLSearchInterceptor } from './search';
import { setData, setStorage } from './services';
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
  private readonly storage: DataStorage;
  private readonly config: ConfigSchema;
  private isQuerySummaryCollapsed$ = new BehaviorSubject<boolean>(false);
  private resultSummaryEnabled$ = new BehaviorSubject<boolean>(false);

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
    this.storage = new DataStorage(window.localStorage, 'discover.queryAssist.');
  }

  public setup(
    core: CoreSetup<QueryEnhancementsPluginStartDependencies>,
    { data, usageCollection }: QueryEnhancementsPluginSetupDependencies
  ): QueryEnhancementsPluginSetup {
    const { queryString } = data.query;

    // Define controls once for each language and register language configurations outside of `getUpdates$`
    const pplControls = [pplLanguageReference('PPL')];
    const sqlControls = [sqlLanguageReference('SQL')];

    // Register PPL language configuration
    const pplLanguageConfig: LanguageConfig = {
      id: 'PPL',
      title: 'PPL',
      search: new PPLSearchInterceptor({
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
      }),
      getQueryString: (currentQuery: Query) => `source = ${currentQuery.dataset?.title}`,
      fields: { filterable: false, visualizable: false },
      docLink: {
        title: i18n.translate('queryEnhancements.pplLanguage.docLink', {
          defaultMessage: 'PPL documentation',
        }),
        url: 'https://opensearch.org/docs/latest/search-plugins/sql/ppl/syntax/',
      },
      showDocLinks: false,
      editor: createEditor(SingleLineInput, null, pplControls, DefaultInput),
      editorSupportedAppNames: ['discover'],
      supportedAppNames: ['discover', 'data-explorer'],
      sampleQueries: [
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleContainsWind', {
            defaultMessage: 'The title field contains the word wind.',
          }),
          query: `SOURCE = your_table | WHERE LIKE(title, '%wind%')`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleContainsWindOrWindy', {
            defaultMessage: 'The title field contains the word wind or the word windy.',
          }),
          query: `SOURCE = your_table | WHERE LIKE(title, '%wind%') OR LIKE(title, '%windy%')`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleContainsPhraseWindRises', {
            defaultMessage: 'The title field contains the phrase wind rises.',
          }),
          query: `SOURCE = your_table | WHERE LIKE(title, '%wind rises%')`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleExactMatchWindRises', {
            defaultMessage: 'The title.keyword field exactly matches The wind rises.',
          }),
          query: `SOURCE = your_table | WHERE title = 'The wind rises'`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleFieldsContainWind', {
            defaultMessage:
              'Any field that starts with title (for example, title and title.keyword) contains the word wind',
          }),
          query: `SOURCE = your_table | WHERE LIKE(title, '%wind%') OR title = 'wind'`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.descriptionFieldExists', {
            defaultMessage: 'Documents in which the field description exists.',
          }),
          query: `SOURCE = your_table | WHERE ISNOTNULL(description) AND description != '';`,
        },
      ],
    };
    queryString.getLanguageService().registerLanguage(pplLanguageConfig);

    // Register SQL language configuration
    const sqlLanguageConfig: LanguageConfig = {
      id: 'SQL',
      title: 'OpenSearch SQL',
      search: new SQLSearchInterceptor({
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
      }),
      getQueryString: (currentQuery: Query) =>
        `SELECT * FROM ${currentQuery.dataset?.title} LIMIT 10`,
      fields: { filterable: false, visualizable: false },
      docLink: {
        title: i18n.translate('queryEnhancements.sqlLanguage.docLink', {
          defaultMessage: 'SQL documentation',
        }),
        url: 'https://opensearch.org/docs/latest/search-plugins/sql/sql/basic/',
      },
      showDocLinks: false,
      editor: createEditor(SingleLineInput, null, sqlControls, DefaultInput),
      editorSupportedAppNames: ['discover'],
      supportedAppNames: ['discover', 'data-explorer'],
      hideDatePicker: true,
      sampleQueries: [
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleContainsWind', {
            defaultMessage: 'The title field contains the word wind.',
          }),
          query: `SELECT * FROM your_table WHERE title LIKE '%wind%'`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleContainsWindOrWindy', {
            defaultMessage: 'The title field contains the word wind or the word windy.',
          }),
          query: `SELECT * FROM your_table WHERE title LIKE '%wind%' OR title LIKE '%windy%';`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleContainsPhraseWindRises', {
            defaultMessage: 'The title field contains the phrase wind rises.',
          }),
          query: `SELECT * FROM your_table WHERE title LIKE '%wind rises%'`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleExactMatchWindRises', {
            defaultMessage: 'The title.keyword field exactly matches The wind rises.',
          }),
          query: `SELECT * FROM your_table WHERE title = 'The wind rises'`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.titleFieldsContainWind', {
            defaultMessage:
              'Any field that starts with title (for example, title and title.keyword) contains the word wind',
          }),
          query: `SELECT * FROM your_table WHERE title LIKE '%wind%' OR title = 'wind'`,
        },
        {
          title: i18n.translate('queryEnhancements.sampleQuery.descriptionFieldExists', {
            defaultMessage: 'Documents in which the field description exists.',
          }),
          query: `SELECT * FROM your_table WHERE description IS NOT NULL AND description != '';`,
        },
      ],
    };
    queryString.getLanguageService().registerLanguage(sqlLanguageConfig);
    data.__enhance({
      editor: {
        queryEditorExtension: createQueryAssistExtension(
          core,
          data,
          this.config.queryAssist,
          this.isQuerySummaryCollapsed$,
          this.resultSummaryEnabled$,
          usageCollection
        ),
      },
    });

    queryString.getDatasetService().registerType(s3TypeConfig);

    return {
      isQuerySummaryCollapsed$: this.isQuerySummaryCollapsed$,
      resultSummaryEnabled$: this.resultSummaryEnabled$,
    };
  }

  public start(
    core: CoreStart,
    { data }: QueryEnhancementsPluginStartDependencies
  ): QueryEnhancementsPluginStart {
    setStorage(this.storage);
    setData(data);
    return {};
  }

  public stop() {}
}
