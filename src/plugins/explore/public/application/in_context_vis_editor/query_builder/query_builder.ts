/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Subscription, from, of, combineLatest } from 'rxjs';
import { distinctUntilChanged, switchMap, debounceTime, filter, skip } from 'rxjs/operators';
import moment from 'moment';
import { firstValueFrom } from '@osd/std';
import { isEqual } from 'lodash';
import type { monaco } from '@osd/monaco';
import { map } from 'rxjs/operators';
import {
  EditorMode,
  QueryResultStatus,
  QueryExecutionStatus,
} from '../../../application/utils/state_management/types';
import { ISearchResult } from '../../../application/utils/state_management/slices';
import { ExploreServices } from '../../../types';
import { prepareQueryForLanguage } from '../../../application/utils/languages';

import { Dataset, DEFAULT_DATA, DataView, Query } from '../../../../../data/common';
import {
  QueryAssistParameters,
  QueryAssistResponse,
} from '../../../../../query_enhancements/common/query_assist';

import { getPromptModeIsAvailable } from '../../../application/utils/get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../../application/utils/get_summary_agent_is_available';
import { generatePromQLWithAgUi } from '../../../application/utils/query_assist/promql_generator';
import {
  queryExecution,
  getPreloadedQueryState,
  showPromptModeNotAvailableWarning,
  showMissingPromptWarning,
  showMissingDatasetWarning,
  handleAgentError,
} from './utils';

// AbortControllers for active queries, keyed by query string
// Currently only one query executing at a time
// Use map to handle multiple queries in the future
const activeQueryAbortControllers = new Map<string, AbortController>();

export const abortAllActiveQueries = () => {
  activeQueryAbortControllers.forEach((controller) => {
    controller.abort();
  });
  activeQueryAbortControllers.clear();
};

export enum SupportLanguageType {
  ppl = 'PPL',
  promQL = 'PROMQL',
  ai = 'AI',
}

// type QueryWithQueryAsString

export interface QueryState {
  query: string;
  language: string;
  dataset?: Dataset;
}

export interface QueryEditorState {
  queryStatus: QueryResultStatus;
  editorMode: EditorMode;
  promptModeIsAvailable: boolean;
  promptToQueryIsLoading: boolean;
  summaryAgentIsAvailable: boolean;

  isQueryEditorDirty: boolean;
  dateRange?: { from: string; to: string };
  userInitiatedQuery: boolean;
  languageType: SupportLanguageType;
  lastExecutedTranslatedQuery?: string; // last generated query
}

// TODO cache previous query results
export type QueryResultState = ISearchResult | undefined;

export interface DatasetViewState {
  dataView: DataView | undefined;
  isLoading: boolean;
  error: string | null;
}

const initialQueryStatus = {
  status: QueryExecutionStatus.UNINITIALIZED,
  elapsedMs: undefined,
  startTime: undefined,
};

const initialQueryEditorState: QueryEditorState = {
  queryStatus: initialQueryStatus,
  editorMode: EditorMode.Query,
  promptModeIsAvailable: false,
  promptToQueryIsLoading: false,
  summaryAgentIsAvailable: false,
  isQueryEditorDirty: false,
  dateRange: undefined,
  userInitiatedQuery: false, // user click the refresh button
  languageType: SupportLanguageType.ppl,
  lastExecutedTranslatedQuery: undefined,
};

/**
 * QueryBuilder manages query state for in-context Explore editor.
 */
export class QueryBuilder {
  public queryState$ = new BehaviorSubject<QueryState>({
    query: '',
    language: 'PPL',
    dataset: undefined,
  });

  public queryEditorState$ = new BehaviorSubject<QueryEditorState>(initialQueryEditorState);

  public resultState$ = new BehaviorSubject<QueryResultState>(undefined);
  public datasetView$ = new BehaviorSubject<DatasetViewState>({
    dataView: undefined,
    isLoading: false,
    error: null,
  });

  private services: ExploreServices;
  private isInitialized = false;
  private editorRef: monaco.editor.IStandaloneCodeEditor | null = null;
  private subscriptions = Array<Subscription>();

  constructor(services: ExploreServices) {
    this.services = services;
  }

  init() {
    if (this.isInitialized) {
      return;
    }

    this.setupGlobalDataRangeSync();
    this.setupQuerySync();
    this.setupLanguageSync();
    this.consoleResult();

    this.setIsInitialized(true);
  }

  startUrlSync() {
    if (!this.isInitialized) {
      return;
    }

    // Sync _eq only when queryState changes
    const queryStateUrlSync = this.queryState$
      .pipe(
        distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
        debounceTime(500)
      )
      .subscribe((queryState) => {
        this.syncToUrl('_eq', queryState);
      });

    // Sync _e only when languageType changes
    const editorStateUrlSync = this.queryEditorState$
      .pipe(
        map((state) => state.languageType),
        distinctUntilChanged(),
        debounceTime(500)
      )
      .subscribe((languageType) => {
        this.syncToUrl('_e', { languageType });
      });

    this.subscriptions.push(queryStateUrlSync, editorStateUrlSync);
  }

  private syncToUrl(place: string, state: QueryState | Partial<QueryEditorState>) {
    const urlStateStorage = this.services.osdUrlStateStorage;
    if (urlStateStorage) {
      urlStateStorage.set(place, state, { replace: true });
    }
  }

  // Subscribe to sync data range with global time filter
  private setupGlobalDataRangeSync() {
    const dataRangeSyncSub = this.queryEditorState$
      .pipe(
        map((state) => state?.dateRange),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((dateRange) => {
        if (dateRange && this.services.data?.query?.timefilter?.timefilter) {
          const timefilter = this.services.data.query.timefilter.timefilter;
          const currentTimefilterRange = timefilter.getTime();

          if (!isEqual(currentTimefilterRange, dateRange)) {
            timefilter.setTime(dateRange);
          }
        }
      });

    this.subscriptions.push(dataRangeSyncSub);
  }

  private async handleDatasetChange(dataset?: Dataset): Promise<DataView | undefined> {
    if (!dataset) {
      this.updateQueryEditorState({
        promptModeIsAvailable: false,
        summaryAgentIsAvailable: false,
      });
      return undefined;
    }

    const dataView = await this.fetchDataView(dataset);
    await this.checkAgentAvailability(dataset?.dataSource?.id);
    return dataView;
  }

  private setupQuerySync() {
    const querySyncSub = this.queryState$
      .pipe(
        distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
        switchMap((newQuery) => {
          const currentQuery = this.services.data.query.queryString.getQuery();
          const isDatasetChanged = !isEqual(currentQuery?.dataset, newQuery?.dataset);
          const isLanguageChanged = !isEqual(currentQuery?.language, newQuery?.language);

          // sync query state with global queryStringManager
          this.services.data.query.queryString.setQuery(newQuery);

          // sync dataset change
          // check isLanguageChanged for the initial sync
          if (isDatasetChanged || isLanguageChanged) {
            this.datasetView$.next({ ...this.datasetView$.getValue(), isLoading: true });
            return from(this.handleDatasetChange(newQuery.dataset));
          }

          return of(null); // no change
        }),
        filter((result) => result !== null)
      )
      .subscribe({
        next: (dataView) => {
          this.datasetView$.next({
            dataView,
            isLoading: false,
            error: null,
          });
        },
        error: (error) => {
          this.datasetView$.next({
            dataView: undefined,
            isLoading: false,
            error: `Error loading dataset: ${error.message}`,
          });
          this.services.notifications?.toasts.addError(error, {
            title: 'Error loading dataset',
          });
        },
      });

    this.subscriptions.push(querySyncSub);
  }

  private setupLanguageSync() {
    const languageSyncSub = this.queryEditorState$
      .pipe(
        map((state) => state?.languageType),
        distinctUntilChanged(), // Skip initial preparation
        skip(1),
        filter((languageType) => languageType !== SupportLanguageType.ai),
        switchMap((languageType) => {
          // set loading to block user execution actions during async gap
          this.datasetView$.next({ dataView: undefined, isLoading: true, error: null });
          return from(getPreloadedQueryState(this.services, languageType));
        }),
        filter((newQuery) => newQuery !== null && newQuery !== undefined)
      )
      .subscribe({
        next: (newQuery) => {
          this.updateQueryState(newQuery);
        },
        error: (error) => {
          this.datasetView$.next({ dataView: undefined, isLoading: false, error: error.message });
          this.services.notifications?.toasts.addError(error, {
            title: 'Error switching language',
          });
        },
      });

    this.subscriptions.push(languageSyncSub);
  }

  private async checkAgentAvailability(datasourceId?: string) {
    const [promptMode, summaryAgent] = await Promise.allSettled([
      getPromptModeIsAvailable(this.services),
      getSummaryAgentIsAvailable(this.services, datasourceId || ''),
    ]);

    const updates: Partial<QueryEditorState> = {};
    if (promptMode.status === 'fulfilled') {
      updates.promptModeIsAvailable = promptMode.value;
    }
    if (summaryAgent.status === 'fulfilled') {
      updates.summaryAgentIsAvailable = summaryAgent.value;
    }
    if (Object.keys(updates).length > 0) {
      this.updateQueryEditorState(updates);
    }
  }

  // TODO remove Debug
  private consoleResult() {
    const syncResult = combineLatest([
      this.datasetView$,
      this.queryState$,
      this.queryEditorState$,
      this.resultState$,
    ]).subscribe(([valA, valB, queryEditorState, resultState]) => {
      console.log('sync Result', valA, valB, queryEditorState, resultState);
    });

    this.subscriptions.push(syncResult);
  }

  private async fetchDataView(dataset: Dataset) {
    const {
      dataViews,
      query: { queryString },
    } = this.services.data;

    const onlyCheckCache = dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
    let dataView = await dataViews.get(dataset.id, onlyCheckCache);
    if (!dataView) {
      // Cache the dataset
      await queryString.getDatasetService().cacheDataset(
        dataset,
        {
          uiSettings: this.services.uiSettings,
          savedObjects: this.services.savedObjects,
          notifications: this.services.notifications,
          http: this.services.http,
          data: this.services.data,
        },
        false
      );

      // Try to get it again from cache
      dataView = await dataViews.get(dataset.id, onlyCheckCache);
    }
    return dataView;
  }

  // This is used when user proactively submits a query or a prompt.
  // This called executeQuery under the hood
  async onEditorRunActionCreator() {
    const queryEditorState = this.queryEditorState$.value;
    // Set flag to indicate user has initiated a query
    this.updateQueryEditorState({ userInitiatedQuery: true });

    const { editorMode, promptModeIsAvailable } = queryEditorState;
    if (editorMode === EditorMode.Prompt) {
      // Handle the unlikely situation where user is on prompt mode but does not have prompt available
      if (!promptModeIsAvailable) {
        showPromptModeNotAvailableWarning(this.services.notifications.toasts);
        return;
      }

      await this.callAgentActionCreator();
    } else {
      await this.executeQuery();
    }
  }

  async callAgentActionCreator() {
    if (!this.editorRef) return;

    // for prompt mode, we won't store the prompt and generated query
    // so directly read user input
    const editorText = this.editorRef.getValue();

    if (!editorText.length) {
      showMissingPromptWarning(this.services.notifications.toasts);
      return;
    }

    const currentQuery = this.services.data.query.queryString.getQuery();
    if (!currentQuery.dataset) {
      showMissingDatasetWarning(this.services.notifications.toasts);
      return;
    }

    try {
      this.updateQueryEditorState({ promptToQueryIsLoading: true });
      if (currentQuery.dataset.type === 'PROMETHEUS') {
        const result = await generatePromQLWithAgUi({
          data: this.services.data,
          question: editorText,
          dataSourceName: currentQuery.dataset.title,
          dataSourceId: currentQuery.dataset.dataSource?.id,
          dataSourceMeta: currentQuery.dataset.dataSource?.meta as Record<string, unknown>,
        });

        const queryString = result.query;

        this.clearResultState();

        this.updateQueryEditorState({
          queryStatus: initialQueryStatus,
          // isQueryEditorDirty: false,
          lastExecutedTranslatedQuery: queryString,
        });

        await queryExecution({
          services: this.services,
          queryString,
          updateEditorStateFn: this.updateQueryEditorState.bind(this),
          updateResultFn: this.updateQueryResultForEditor.bind(this),
          activeQueryAbortControllers,
        });

        return;
      }

      const params: QueryAssistParameters = {
        question: editorText,
        index: currentQuery.dataset.title,
        language: 'PPL',
        dataSourceId: currentQuery.dataset.dataSource?.id,
        currentTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        timeField: currentQuery.dataset.timeFieldName,
      };

      const response = await this.services.http.post<QueryAssistResponse>(
        '/api/enhancements/assist/generate',
        {
          body: JSON.stringify(params),
        }
      );
      if (response.timeRange) {
        const convertedTimeRange = {
          from: moment(response.timeRange.from, 'YYYY-MM-DD HH:mm:ss').toISOString(),
          to: moment(response.timeRange.to, 'YYYY-MM-DD HH:mm:ss').toISOString(),
        };
        this.services.data.query.timefilter.timefilter.setTime(convertedTimeRange);
      }
      const queryString = response.query;

      this.clearResultState();

      this.updateQueryEditorState({
        queryStatus: initialQueryStatus,
        // isQueryEditorDirty: false,
        lastExecutedTranslatedQuery: queryString,
      });

      await queryExecution({
        services: this.services,
        queryString,
        updateEditorStateFn: this.updateQueryEditorState.bind(this),
        updateResultFn: this.updateQueryResultForEditor.bind(this),
        activeQueryAbortControllers,
      });
    } catch (error) {
      handleAgentError(this.services.notifications.toasts, error);
    } finally {
      this.updateQueryEditorState({ promptToQueryIsLoading: false });
    }
  }

  setIsInitialized(isInitialized: boolean) {
    this.isInitialized = isInitialized;
  }

  clearResultState() {
    this.resultState$.next(undefined);
  }

  updateQueryEditorState(updates: Partial<QueryEditorState>) {
    const currentState = this.queryEditorState$.value;
    this.queryEditorState$.next({
      ...currentState,
      ...updates,
    });
  }

  updateQueryResultForEditor(result: ISearchResult | undefined) {
    this.resultState$.next(result);
  }

  updateQueryState(updates: Partial<QueryState>) {
    const currentState = this.queryState$.value;
    const updatedQuery = {
      ...currentState,
      ...updates,
    };

    this.queryState$.next(updatedQuery);
  }

  async waitForDatasetReady(): Promise<DatasetViewState> {
    return firstValueFrom(this.datasetView$.pipe(filter((dv) => !dv.isLoading)));
  }

  async executeQuery() {
    this.clearResultState();

    this.updateQueryEditorState({
      queryStatus: initialQueryStatus,
    });

    if (
      this.datasetView$.value.isLoading ||
      this.datasetView$.value.error ||
      !this.datasetView$.value.dataView
    ) {
      return;
    }
    const currentQuery = this.queryState$.value;
    // prepare querystring for execution, add clause when query is '' for PPL
    const queryString = this.prepareQueryStringToCacheKey(currentQuery);

    await queryExecution({
      services: this.services,
      queryString,
      updateEditorStateFn: this.updateQueryEditorState.bind(this),
      updateResultFn: this.updateQueryResultForEditor.bind(this),
      activeQueryAbortControllers,
    });
  }

  private prepareQueryStringToCacheKey(query: Query) {
    const preparedQuery = prepareQueryForLanguage(query);
    return preparedQuery.query;
  }

  setEditorRef(editor: monaco.editor.IStandaloneCodeEditor | null) {
    this.editorRef = editor;
  }

  getEditorRef(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editorRef;
  }

  getQueryEditorState() {
    return this.queryEditorState$.value;
  }

  getDataView() {
    return this.datasetView$.value.dataView;
  }

  dispose(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    this.queryEditorState$.complete();
    this.queryState$.complete();
    this.resultState$.complete();
    this.datasetView$.complete();
  }

  reset(): void {
    this.dispose();
    this.queryState$ = new BehaviorSubject<QueryState>({
      query: '',
      language: 'PPL',
      dataset: undefined,
    });

    this.queryEditorState$ = new BehaviorSubject<QueryEditorState>(initialQueryEditorState);

    this.resultState$ = new BehaviorSubject<QueryResultState>(undefined);
    this.datasetView$ = new BehaviorSubject<DatasetViewState>({
      dataView: undefined,
      isLoading: false,
      error: null,
    });
    this.isInitialized = false;
  }
}

// Singleton instance
let queryBuilderInstance: QueryBuilder | null = null;

export function createQueryBuilder(services: ExploreServices): QueryBuilder {
  queryBuilderInstance = new QueryBuilder(services);
  return queryBuilderInstance;
}

let queryBuilder: QueryBuilder;

export function getQueryBuilder(services: ExploreServices): QueryBuilder {
  if (!queryBuilder) {
    queryBuilder = createQueryBuilder(services);
  }

  return queryBuilder;
}
