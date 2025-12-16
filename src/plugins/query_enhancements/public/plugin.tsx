/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { BehaviorSubject, Subscription } from 'rxjs';
import moment from 'moment';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { DataStorage, OSD_FIELD_TYPES } from '../../data/common';
import {
  createEditor,
  DefaultInput,
  LanguageConfig,
  Query,
  SingleLineInput,
} from '../../data/public';
import { ConfigSchema } from '../common/config';
import { s3TypeConfig } from './datasets';
import { prometheusTypeConfig } from './datasets/prometheus_type';
import { createQueryAssistExtension } from './query_assist';
import { pplLanguageReference, sqlLanguageReference } from './query_editor_extensions';
import { PPLSearchInterceptor, SQLSearchInterceptor } from './search';
import { setData, setStorage, setUiActions } from './services';
import {
  QueryEnhancementsPluginSetup,
  QueryEnhancementsPluginSetupDependencies,
  QueryEnhancementsPluginStart,
  QueryEnhancementsPluginStartDependencies,
} from './types';
import { PPLFilterUtils } from './search/filters';
import { NaturalLanguageFilterUtils } from './search/filters/natural_language_filter_utils';
import { PromQLSearchInterceptor } from './search/promql_search_interceptor';
import { PrometheusResourceClient } from './resources';

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
  private isSummaryAgentAvailable$ = new BehaviorSubject<boolean>(false);
  private currentAppId$ = new BehaviorSubject<string | undefined>(undefined);
  private appIdSubscription?: Subscription;

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
    this.storage = new DataStorage(window.localStorage, 'discover.queryAssist.');
  }

  public setup(
    core: CoreSetup<QueryEnhancementsPluginStartDependencies>,
    { data, usageCollection }: QueryEnhancementsPluginSetupDependencies
  ): QueryEnhancementsPluginSetup {
    const { queryString } = data.query;
    const { currentAppId$ } = this;

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
      addFiltersToQuery: PPLFilterUtils.addFiltersToQuery,
      addFiltersToPrompt: NaturalLanguageFilterUtils.addFiltersToPrompt,
      fields: {
        sortable: false,
        get filterable() {
          const currentAppId = currentAppId$.getValue();
          // PPL filters are only supported in explore and dashboards, return
          // undefined to use `filterable` value from field definitions.
          if (currentAppId?.startsWith('explore/') || currentAppId === 'dashboards')
            return undefined;
          return false;
        },
        visualizable: false,
        formatter: (value: string, type: OSD_FIELD_TYPES) => {
          switch (type) {
            case OSD_FIELD_TYPES.DATE:
              return moment.utc(value).format('YYYY-MM-DDTHH:mm:ss.SSSZ'); // PPL date fields need special formatting in order for discover table formatter to render in the correct time zone

            default:
              return value;
          }
        },
      },
      docLink: {
        title: i18n.translate('queryEnhancements.pplLanguage.docLink', {
          defaultMessage: 'PPL documentation',
        }),
        url: 'https://opensearch.org/docs/latest/search-plugins/sql/ppl/syntax/',
      },
      showDocLinks: false,
      editor: createEditor(SingleLineInput, null, pplControls, DefaultInput),
      editorSupportedAppNames: ['discover', 'explore'],
      supportedAppNames: ['discover', 'data-explorer', 'explore', 'dataset_management'],
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
      fields: { sortable: false, filterable: false, visualizable: false },
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
          this.isSummaryAgentAvailable$,
          this.resultSummaryEnabled$,
          usageCollection
        ),
      },
    });

    queryString.getDatasetService().registerType(s3TypeConfig);

    const promqlLanguageConfig: LanguageConfig = {
      id: 'PROMQL',
      title: 'PromQL',
      search: new PromQLSearchInterceptor({
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
      }),
      getQueryString: (currentQuery: Query) => '',
      fields: {
        sortable: false,
        filterable: false,
        visualizable: false,
        formatter: (value: string, type: OSD_FIELD_TYPES) => {
          switch (type) {
            case OSD_FIELD_TYPES.DATE:
              return moment.utc(value).format('YYYY-MM-DDTHH:mm:ss.SSSZ'); // Date fields need special formatting in order for discover table formatter to render in the correct time zone

            default:
              return value;
          }
        },
      },
      docLink: {
        title: i18n.translate('queryEnhancements.promqlLanguage.docLink', {
          defaultMessage: 'PromQL documentation',
        }),
        url: 'https://prometheus.io/docs/prometheus/latest/querying/basics/',
      },
      showDocLinks: false,
      editor: createEditor(SingleLineInput, null, pplControls, DefaultInput),
      editorSupportedAppNames: ['explore'],
      supportedAppNames: ['explore'],
      sampleQueries: [
        {
          title: i18n.translate('queryEnhancements.promqlSampleQuery.upMetric', {
            defaultMessage: 'Query the up metric',
          }),
          query: `up`,
        },
        {
          title: i18n.translate('queryEnhancements.promqlSampleQuery.rateQuery', {
            defaultMessage: 'Query rate of HTTP requests',
          }),
          query: `rate(http_requests_total[5m])`,
        },
        {
          title: i18n.translate('queryEnhancements.promqlSampleQuery.aggregation', {
            defaultMessage: 'Sum by job',
          }),
          query: `sum by (job) (rate(http_requests_total[5m]))`,
        },
      ],
    };
    queryString.getLanguageService().registerLanguage(promqlLanguageConfig);
    queryString.getDatasetService().registerType(prometheusTypeConfig);

    // Register prometheus resource client
    data.resourceClientFactory.register('prometheus', (http) => new PrometheusResourceClient(http));

    return {
      isQuerySummaryCollapsed$: this.isQuerySummaryCollapsed$,
      resultSummaryEnabled$: this.resultSummaryEnabled$,
      isSummaryAgentAvailable$: this.isSummaryAgentAvailable$,
    };
  }

  public start(
    core: CoreStart,
    { data, uiActions }: QueryEnhancementsPluginStartDependencies
  ): QueryEnhancementsPluginStart {
    setStorage(this.storage);
    setData(data);
    setUiActions(uiActions);
    this.appIdSubscription = core.application.currentAppId$.subscribe((appId) => {
      this.currentAppId$.next(appId);
    });

    return {};
  }

  public stop() {
    if (this.appIdSubscription) {
      this.appIdSubscription.unsubscribe();
    }
  }
}
