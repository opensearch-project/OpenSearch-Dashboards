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
import { IVariableInterpolationService } from '../../../../../dashboard/public';

import { Dataset, DEFAULT_DATA, DataView, Query } from '../../../../../data/common';
import {
  QueryAssistParameters,
  QueryAssistResponse,
} from '../../../../../query_enhancements/common/query_assist';

import { getPromptModeIsAvailable } from '../../../application/utils/get_prompt_mode_is_available';
import { generatePromQLWithAgUi } from '../../../application/utils/query_assist/promql_generator';
import {
  queryExecution,
  getPreloadedQueryState,
  showPromptModeNotAvailableWarning,
  showMissingPromptWarning,
  showMissingDatasetWarning,
  handleAgentError,
} from './utils';
import { getServices as getExploreServices } from '../../../services/services';
import { QUERY_BUILDER_QUERY_STATE_KEY, QUERY_EDITOR_STATE_KEY } from '../types';

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

  isQueryEditorDirty: boolean;
  dateRange?: { from: string; to: string };
  userInitiatedQuery: boolean;
  languageType: SupportLanguageType;
  lastExecutedTranslatedQuery?: string; // last generated query
}

export type QueryResultState = ISearchResult | undefined;

export interface DatasetViewState {
  dataView: DataView | undefined;
  isLoading: boolean;
  error: string | null;
}

export const initialQueryStatus = {
  status: QueryExecutionStatus.UNINITIALIZED,
  elapsedMs: undefined,
  startTime: undefined,
};

const initialQueryEditorState: QueryEditorState = {
  queryStatus: initialQueryStatus,
  editorMode: EditorMode.Query,
  promptModeIsAvailable: false,
  promptToQueryIsLoading: false,
  isQueryEditorDirty: false,
  dateRange: undefined,
  userInitiatedQuery: false, // user click the refresh button
  languageType: SupportLanguageType.ppl,
  lastExecutedTranslatedQuery: undefined,
};

/**
 * QueryBuilder manages query state for query editor component.
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
  private isInitialized = false;
  private editorRef: monaco.editor.IStandaloneCodeEditor | null = null;
  private subscriptions = Array<Subscription>();
  private getServices: () => ExploreServices;
  private interpolationService?: IVariableInterpolationService;
  public lastExecutedInterpolatedQuery?: string;

  constructor(getServices: () => ExploreServices) {
    this.getServices = getServices;
  }

  async init(options?: { savedQueryState?: QueryState }) {
    if (this.isInitialized) {
      return;
    }

    let queryEditorStateFromUrl;
    let queryStateFromUrl;

    const urlStateStorage = this.getServices().osdUrlStateStorage;
    if (urlStateStorage) {
      queryEditorStateFromUrl = urlStateStorage?.get<Partial<QueryEditorState>>(
        QUERY_EDITOR_STATE_KEY
      );
      queryStateFromUrl = urlStateStorage?.get<QueryState>(QUERY_BUILDER_QUERY_STATE_KEY);
    }

    const languageType =
      queryEditorStateFromUrl?.languageType ??
      options?.savedQueryState?.language ??
      SupportLanguageType.ppl;

    const preferredDataset = queryStateFromUrl?.dataset ?? options?.savedQueryState?.dataset;

    // Retrieve the preloaded query state based on the language type for a new explore object,
    // or validate whether the URL dataset is compatible with the language type before proceeding.
    // This prevents errors that would otherwise be thrown and avoids invalid operations
    // that sync to the global query string, which is consumed by other components like the data timepicker.
    // This ensures that the returned dataset is either valid or explicitly undefined.

    const preloadedQueryState = await getPreloadedQueryState(
      this.getServices(),
      languageType as SupportLanguageType,
      preferredDataset
    );

    if (queryEditorStateFromUrl?.languageType) {
      this.updateQueryEditorState({ languageType: queryEditorStateFromUrl.languageType });
    }

    // read isQueryEditorDirty from url to prevent losing state after reloading page
    // only update when isQueryEditorDirty is true
    if (
      queryEditorStateFromUrl?.isQueryEditorDirty &&
      typeof queryEditorStateFromUrl?.isQueryEditorDirty === 'boolean'
    ) {
      this.updateQueryEditorState({
        isQueryEditorDirty: queryEditorStateFromUrl.isQueryEditorDirty,
      });
    }

    const finalQuery = queryStateFromUrl?.query ?? options?.savedQueryState?.query ?? '';
    // apply query
    const finalQueryState = {
      ...preloadedQueryState,
      query: finalQuery,
    };

    this.updateQueryState(finalQueryState);
    this.updateQueryEditorState({
      editorMode: EditorMode.Query,
      queryStatus: initialQueryStatus,
    });

    this.setupGlobalDataRangeSync();
    this.setupQuerySync();
    this.setupLanguageSync();
    // start sync until dataview is ready
    await this.waitForDatasetReady();
    this.startUrlSync();
    this.setIsInitialized(true);
  }

  startUrlSync() {
    const urlSync = combineLatest([
      this.queryState$,
      this.queryEditorState$.pipe(
        map((s) => ({ languageType: s.languageType, isQueryEditorDirty: s.isQueryEditorDirty }))
      ),
    ])
      .pipe(debounceTime(500))
      .subscribe(([queryState, editorState]) => {
        this.syncToUrl(QUERY_BUILDER_QUERY_STATE_KEY, queryState);
        this.syncToUrl(QUERY_EDITOR_STATE_KEY, editorState);
      });

    this.subscriptions.push(urlSync);
  }

  private syncToUrl(place: string, state: QueryState | Partial<QueryEditorState>) {
    const urlStateStorage = this.getServices()?.osdUrlStateStorage;

    if (urlStateStorage) {
      urlStateStorage.set(place, state, { replace: true });
    }
  }

  // Subscribe to sync date range with global time filter
  private setupGlobalDataRangeSync() {
    const dataRangeSyncSub = this.queryEditorState$
      .pipe(
        map((state) => state?.dateRange),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((dateRange) => {
        if (dateRange && this.getServices().data?.query?.timefilter?.timefilter) {
          const timefilter = this.getServices().data.query.timefilter.timefilter;
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
          const currentQuery = this.getServices().data.query.queryString.getQuery();
          const isDatasetChanged = !isEqual(currentQuery?.dataset, newQuery?.dataset);
          const isLanguageChanged = !isEqual(currentQuery?.language, newQuery?.language);

          // sync query state with global queryStringManager
          this.getServices().data.query.queryString.setQuery(newQuery);

          // sync dataset change
          // check isLanguageChanged and isInitialized for the initial sync
          if (isDatasetChanged || isLanguageChanged || !this.isInitialized) {
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
          this.getServices().notifications?.toasts.addError(error, {
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
          return from(getPreloadedQueryState(this.getServices(), languageType));
        }),
        filter((newQuery) => newQuery !== null && newQuery !== undefined)
      )
      .subscribe({
        next: (newQuery) => {
          this.updateQueryState(newQuery);
        },
        error: (error) => {
          this.datasetView$.next({ dataView: undefined, isLoading: false, error: error.message });
          this.getServices().notifications?.toasts.addError(error, {
            title: 'Error switching language',
          });
        },
      });

    this.subscriptions.push(languageSyncSub);
  }

  private async checkAgentAvailability(_datasourceId?: string) {
    const result = await getPromptModeIsAvailable(this.getServices());
    this.updateQueryEditorState({ promptModeIsAvailable: result });
  }

  private async fetchDataView(dataset: Dataset) {
    const {
      dataViews,
      query: { queryString },
    } = this.getServices().data;

    const onlyCheckCache = dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
    let dataView = await dataViews.get(dataset.id, onlyCheckCache);
    if (!dataView) {
      // Cache the dataset
      await queryString.getDatasetService().cacheDataset(
        dataset,
        {
          uiSettings: this.getServices().uiSettings,
          savedObjects: this.getServices().savedObjects,
          notifications: this.getServices().notifications,
          http: this.getServices().http,
          data: this.getServices().data,
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
  async onQueryExecutionSubmit() {
    const queryEditorState = this.queryEditorState$.value;
    // Set flag to indicate user has initiated a query
    this.updateQueryEditorState({ userInitiatedQuery: true });

    const { editorMode, promptModeIsAvailable } = queryEditorState;
    if (editorMode === EditorMode.Prompt) {
      // Handle the unlikely situation where user is on prompt mode but does not have prompt available
      if (!promptModeIsAvailable) {
        showPromptModeNotAvailableWarning(this.getServices().notifications.toasts);
        return;
      }

      await this.callAgent();
    } else {
      await this.executeQuery();
    }
  }

  async callAgent() {
    if (!this.editorRef) return;

    // for prompt mode, we won't store the prompt and generated query
    // so directly read user input
    const editorText = this.editorRef.getValue();

    if (!editorText.length) {
      showMissingPromptWarning(this.getServices().notifications.toasts);
      return;
    }

    const currentQuery = this.getServices().data.query.queryString.getQuery();
    if (!currentQuery.dataset) {
      showMissingDatasetWarning(this.getServices().notifications.toasts);
      return;
    }

    try {
      this.updateQueryEditorState({ promptToQueryIsLoading: true });
      if (currentQuery.dataset.type === 'PROMETHEUS') {
        const result = await generatePromQLWithAgUi({
          data: this.getServices().data,
          question: editorText,
          dataSourceName: currentQuery.dataset.title,
          dataSourceId: currentQuery.dataset.dataSource?.id,
          dataSourceMeta: currentQuery.dataset.dataSource?.meta as Record<string, unknown>,
        });

        const queryString = result.query;

        this.clearResultState();

        this.updateQueryEditorState({
          queryStatus: initialQueryStatus,
          lastExecutedTranslatedQuery: queryString,
        });

        await queryExecution({
          services: this.getServices(),
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

      const response = await this.getServices().http.post<QueryAssistResponse>(
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
        this.getServices().data.query.timefilter.timefilter.setTime(convertedTimeRange);
      }
      const queryString = response.query;

      this.clearResultState();

      this.updateQueryEditorState({
        queryStatus: initialQueryStatus,
        lastExecutedTranslatedQuery: queryString,
      });

      await queryExecution({
        services: this.getServices(),
        queryString,
        updateEditorStateFn: this.updateQueryEditorState.bind(this),
        updateResultFn: this.updateQueryResultForEditor.bind(this),
        activeQueryAbortControllers,
      });
    } catch (error) {
      handleAgentError(this.getServices().notifications.toasts, error);
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
    let queryString = this.prepareQueryStringToCacheKey(currentQuery);

    if (this.interpolationService && this.interpolationService.hasVariables(queryString)) {
      queryString = this.interpolationService.interpolate(queryString, currentQuery.language);
    }

    this.lastExecutedInterpolatedQuery = queryString;

    await queryExecution({
      services: this.getServices(),
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

  setInterpolationService(service: IVariableInterpolationService) {
    this.interpolationService = service;
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

  dispose(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    this.queryEditorState$.complete();
    this.queryState$.complete();
    this.resultState$.complete();
    this.datasetView$.complete();
    abortAllActiveQueries();
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
    this.editorRef = null;
    this.isInitialized = false;
  }
}

// Singleton instance
let queryBuilderInstance: QueryBuilder | null = null;

export function getQueryBuilder(): QueryBuilder {
  if (!queryBuilderInstance) {
    queryBuilderInstance = new QueryBuilder(() => getExploreServices());
  }

  return queryBuilderInstance;
}
