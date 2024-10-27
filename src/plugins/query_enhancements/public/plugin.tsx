/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
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

    // Initialize local storage keys when the plugin loads, if they don't exist
    if (!window.localStorage.getItem('hasSeenSQLInfoBox')) {
      window.localStorage.setItem('hasSeenSQLInfoBox', 'false');
    }
    if (!window.localStorage.getItem('hasSeenPPLInfoBox')) {
      window.localStorage.setItem('hasSeenPPLInfoBox', 'false');
    }

    // Initialize `selectedLanguage` as undefined to wait for correct language updates
    let selectedLanguage;

    // Subscribe to updates to track language changes
    queryString.getUpdates$().subscribe((query) => {
      selectedLanguage = query.language;

      // Re-render the controls when `selectedLanguage` is defined
      const pplControls = [pplLanguageReference(selectedLanguage)];
      const sqlControls = [sqlLanguageReference(selectedLanguage)];

      const enhancedPPLQueryEditor = createEditor(SingleLineInput, null, pplControls, DefaultInput);
      const enhancedSQLQueryEditor = createEditor(SingleLineInput, null, sqlControls, DefaultInput);

      // Define and register PPL language configuration
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
        editor: enhancedPPLQueryEditor,
        editorSupportedAppNames: ['discover'],
        supportedAppNames: ['discover', 'data-explorer'],
      };
      queryString.getLanguageService().registerLanguage(pplLanguageConfig);

      // Define and register SQL language configuration
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
        editor: enhancedSQLQueryEditor,
        editorSupportedAppNames: ['discover'],
        supportedAppNames: ['discover', 'data-explorer'],
        hideDatePicker: true,
        sampleQueries: [
          {
            title: i18n.translate('queryEnhancements.sqlLanguage.sampleQuery.titleContainsWind', {
              defaultMessage: 'The title field contains the word wind.',
            }),
            query: `SELECT * FROM your_table WHERE title LIKE '%wind%'`,
          },
          {
            title: i18n.translate(
              'queryEnhancements.sqlLanguage.sampleQuery.titleContainsWindOrWindy',
              {
                defaultMessage: 'The title field contains the word wind or the word windy.',
              }
            ),
            query: `SELECT * FROM your_table WHERE title LIKE '%wind%' OR title LIKE '%windy%';`,
          },
          {
            title: i18n.translate(
              'queryEnhancements.sqlLanguage.sampleQuery.titleContainsPhraseWindRises',
              {
                defaultMessage: 'The title field contains the phrase wind rises.',
              }
            ),
            query: `SELECT * FROM your_table WHERE title LIKE '%wind rises%'`,
          },
          {
            title: i18n.translate(
              'queryEnhancements.sqlLanguage.sampleQuery.titleExactMatchWindRises',
              {
                defaultMessage: 'The title.keyword field exactly matches The wind rises.',
              }
            ),
            query: `SELECT * FROM your_table WHERE title = 'The wind rises'`,
          },
          {
            title: i18n.translate(
              'queryEnhancements.sqlLanguage.sampleQuery.titleFieldsContainWind',
              {
                defaultMessage:
                  'Any field that starts with title (for example, title and title.keyword) contains the word wind',
              }
            ),
            query: `SELECT * FROM your_table WHERE title LIKE '%wind%' OR title = 'wind'`,
          },
          {
            title: i18n.translate(
              'queryEnhancements.sqlLanguage.sampleQuery.descriptionFieldExists',
              {
                defaultMessage: 'Documents in which the field description exists.',
              }
            ),
            query: `SELECT * FROM your_table WHERE description IS NOT NULL AND description != '';`,
          },
        ],
      };
      queryString.getLanguageService().registerLanguage(sqlLanguageConfig);
    });

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
