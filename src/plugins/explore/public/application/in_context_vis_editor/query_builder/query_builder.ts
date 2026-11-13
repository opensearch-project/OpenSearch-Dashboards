/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, EMPTY, Subscription, from, of } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import moment from 'moment';
import { MutableRefObject } from 'react';
import { firstValueFrom } from '@osd/std';
import { isEqual } from 'lodash';
import type { monaco } from '@osd/monaco';
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
import { PromQLQueryOptions } from '../../../../../query_enhancements/common';

import { getPromptModeIsAvailable } from '../../../application/utils/get_prompt_mode_is_available';
import { generatePromQLWithAgUi } from '../../../application/utils/query_assist/promql_generator';
import {
  queryExecution,
  showPromptModeNotAvailableWarning,
  showMissingPromptWarning,
  handleAgentError,
  withLanguageQueryOptions,
} from './utils';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../common';
import { getSourceTypeRegistry } from '../../../services/source_type_registry';

// Query options shared by every row (the panel's Query options), applied at execution time.
export interface SharedQueryOptions {
  maxDataPoints?: number;
  // Run PromQL with the row's refId (see shouldPrefixSeriesWithRefId): two or more PromQL rows.
  prefixSeriesWithRefId?: boolean;
}

export enum SupportLanguageType {
  ppl = 'PPL',
  promQL = 'PROMQL',
  ai = 'AI',
  sql = 'SQL',
}

export interface QueryState {
  query: string;
  language: string;
  dataset?: Dataset;
  queryOptions?: PromQLQueryOptions;
}

export interface QueryEditorState {
  isHidden?: boolean;
  queryStatus: QueryResultStatus;
  editorMode: EditorMode;
  promptModeIsAvailable: boolean;
  promptToQueryIsLoading: boolean;
  userInitiatedQuery: boolean;
  lastExecutedTranslatedQuery?: string; // last generated query
}

export type QueryResultState = ISearchResult | undefined;

export interface DatasetViewState {
  dataView: DataView | undefined;
  isLoading: boolean;
  error: string | null;
}

// Marks a queryStatus error as a dataset load failure (not a query failure), so a later
// successful load can clear it.
const DATASET_LOAD_ERROR = 'Error loading dataset';

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
  userInitiatedQuery: false, // user click the refresh button
  lastExecutedTranslatedQuery: undefined,
  isHidden: false,
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
  public editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | null> = {
    current: null,
  };
  private subscriptions = Array<Subscription>();
  private getServices: () => ExploreServices;
  // Shared by every row and owned by the container
  private readonly getInterpolationService: () => IVariableInterpolationService | undefined;

  public lastExecutedInterpolatedQuery?: string;

  public refId: string;
  // The query state seen by the previous query sync, to detect dataset/language changes.
  private prevQueryState?: QueryState;
  private activeAbortController?: AbortController;

  // Owned by the container; read at execution time so a change applies on the next run.
  private readonly getSharedQueryOptions: () => SharedQueryOptions;

  constructor(
    getServices: () => ExploreServices,
    refId = 'A',
    getInterpolationService: () => IVariableInterpolationService | undefined = () => undefined,
    getSharedQueryOptions: () => SharedQueryOptions = () => ({})
  ) {
    this.getServices = getServices;
    this.refId = refId;
    this.getInterpolationService = getInterpolationService;
    this.getSharedQueryOptions = getSharedQueryOptions;
  }

  // Initialize row with given and merged state
  init(options?: { savedQueryState?: QueryState; savedEditorState?: Partial<QueryEditorState> }) {
    if (this.isInitialized) {
      return;
    }

    if (typeof options?.savedEditorState?.isHidden === 'boolean') {
      this.updateQueryEditorState({ isHidden: options.savedEditorState.isHidden });
    }

    this.updateQueryState(
      withLanguageQueryOptions(
        options?.savedQueryState ?? {
          query: '',
          language: EXPLORE_DEFAULT_LANGUAGE,
          dataset: undefined,
        }
      )
    );
    this.updateQueryEditorState({
      editorMode: EditorMode.Query,
      queryStatus: initialQueryStatus,
    });

    this.setupQuerySync();

    this.setIsInitialized(true);
  }

  private async handleDatasetChange(query: Query): Promise<DataView | undefined> {
    const dataset = query.dataset;
    if (!dataset) {
      this.updateQueryEditorState({
        promptModeIsAvailable: false,
      });
      return undefined;
    }

    const dataView = await this.fetchDataView(dataset);
    await this.checkAgentAvailability(query);
    return dataView;
  }

  private setupQuerySync() {
    const querySyncSub = this.queryState$
      .pipe(
        // Only a dataset or language change triggers fetch dataview.
        distinctUntilChanged(
          (prev, curr) =>
            isEqual(prev.dataset, curr.dataset) && isEqual(prev.language, curr.language)
        ),
        switchMap((newQuery) => {
          // Compare against this row's own previous state
          const prevQuery = this.prevQueryState;
          this.prevQueryState = newQuery;
          const isDatasetChanged = !isEqual(prevQuery?.dataset, newQuery?.dataset);
          const isLanguageChanged = !isEqual(prevQuery?.language, newQuery?.language);

          // sync dataset change
          // check isLanguageChanged and isInitialized for the initial sync
          if (isDatasetChanged || isLanguageChanged || !this.isInitialized) {
            this.datasetView$.next({ ...this.datasetView$.getValue(), isLoading: true });

            // Handle the error here to avoid error stops stream
            return from(this.handleDatasetChange(newQuery)).pipe(
              catchError((error) => {
                const message = `Error loading dataset: ${error.message}`;
                this.datasetView$.next({
                  dataView: undefined,
                  isLoading: false,
                  error: message,
                });
                this.setDatasetLoadError(message);
                this.getServices().notifications?.toasts.addError(error, {
                  title: `Query ${this.refId}: error loading dataset`,
                });
                return EMPTY;
              })
            );
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
          // A dataset that loads again (the user picked another one) clears its load error.
          if (this.queryEditorState$.value.queryStatus.error?.error === DATASET_LOAD_ERROR) {
            this.updateQueryEditorState({ queryStatus: initialQueryStatus });
          }
        },
      });

    this.subscriptions.push(querySyncSub);
  }

  private async checkAgentAvailability(query: Query) {
    // TODO is AI mode based on dataset or language
    const result = await getPromptModeIsAvailable(this.getServices(), query);
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
        false,
        dataset?.signalType // set data view signalType from dataset
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
    if (!this.editorRef.current) return;

    // for prompt mode, we won't store the prompt and generated query
    // so directly read user input
    const editorText = this.editorRef.current.getValue();

    if (!editorText.length) {
      showMissingPromptWarning(this.getServices().notifications.toasts);
      return;
    }

    // Use this row's own query
    const currentQuery = this.queryState$.getValue();
    if (!currentQuery.dataset) {
      return;
    }

    const abortController = this.createActiveAbortController();
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
        if (abortController.signal.aborted) return;

        const queryString = result.query;

        this.clearResultState();

        this.updateQueryEditorState({
          queryStatus: initialQueryStatus,
          lastExecutedTranslatedQuery: queryString,
        });

        await this.runQuery(queryString, abortController);

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
          signal: abortController.signal,
        }
      );
      if (abortController.signal.aborted) return;
      // TODO handle time range, should single query update container tine range
      // The time range is shared: with several rows running together, the other rows already
      // ran with the current one, so applying it would leave them out of step.
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
      await this.runQuery(queryString, abortController);
    } catch (error) {
      if (abortController.signal.aborted) return;
      handleAgentError(this.getServices().notifications.toasts, error);
    } finally {
      this.clearActiveAbortController(abortController);
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

  // Only for updating PromQL step/legend options
  updateQueryOptions(partial: Partial<PromQLQueryOptions>) {
    const queryOptions = {
      ...this.queryState$.value.queryOptions,
      ...partial,
    };
    this.updateQueryState({ queryOptions });
  }

  async waitForDatasetReady(): Promise<DatasetViewState> {
    return firstValueFrom(this.datasetView$.pipe(filter((dv) => !dv.isLoading)));
  }

  // HTTP failures carry a status code; others (e.g. a deleted index pattern) don't.
  private setDatasetLoadError(message: string) {
    this.updateQueryEditorState({
      queryStatus: {
        status: QueryExecutionStatus.ERROR,
        error: {
          statusCode: 0,
          error: DATASET_LOAD_ERROR,
          message: { details: message, reason: DATASET_LOAD_ERROR },
          originalErrorMessage: message,
        },
      },
    });
  }

  async executeQuery() {
    const abortController = this.createActiveAbortController();
    try {
      this.clearResultState();

      const datasetView = await this.waitForDatasetReady();
      if (abortController.signal.aborted) return;
      if (datasetView.error) return;
      this.updateQueryEditorState({
        queryStatus: initialQueryStatus,
      });

      // No dataset (e.g. a restored row without one): nothing to run, the row doesn't take part.
      if (!datasetView.dataView) {
        return;
      }
      const currentQuery = this.queryState$.value;
      // prepare querystring for execution, add clause when query is '' for PPL
      let queryString = this.prepareQueryStringToCacheKey(currentQuery);

      const interpolationService = this.getInterpolationService();
      if (interpolationService && interpolationService.hasVariables(queryString)) {
        queryString = interpolationService.interpolate(queryString, currentQuery.language);
      }

      this.lastExecutedInterpolatedQuery = queryString;
      await this.runQuery(queryString, abortController);
    } finally {
      this.clearActiveAbortController(abortController);
    }
  }

  private runQuery(queryString: string, abortController: AbortController) {
    return queryExecution({
      services: this.getServices(),
      query: this.withSharedQueryOptions(this.queryState$.getValue()),
      queryString,
      updateEditorStateFn: this.updateQueryEditorState.bind(this),
      updateResultFn: this.updateQueryResultForEditor.bind(this),
      activeQueryAbortController: abortController,
    });
  }

  // A metrics row runs with the panel's max data points (undefined = auto) instead of its own.
  private withSharedQueryOptions(query: QueryState): QueryState {
    if (!getSourceTypeRegistry().isMetricsLanguage(query.language)) return query;

    const { maxDataPoints, prefixSeriesWithRefId } = this.getSharedQueryOptions();
    return {
      ...query,
      queryOptions: {
        ...query.queryOptions,
        maxDataPoints,
        // The refId only with two or more PromQL rows, so a single query keeps its series names.
        ...(prefixSeriesWithRefId ? { refId: this.refId } : {}),
      },
    };
  }

  abortActiveQueries() {
    this.activeAbortController?.abort();
    this.activeAbortController = undefined;
  }

  private createActiveAbortController() {
    this.activeAbortController?.abort();
    this.activeAbortController = new AbortController();
    return this.activeAbortController;
  }

  private clearActiveAbortController(abortController: AbortController) {
    if (this.activeAbortController === abortController) {
      this.activeAbortController = undefined;
    }
  }

  private prepareQueryStringToCacheKey(query: Query) {
    const preparedQuery = prepareQueryForLanguage(query);
    return preparedQuery.query;
  }

  setEditor(editor: monaco.editor.IStandaloneCodeEditor | null) {
    this.editorRef.current = editor;
  }

  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editorRef.current;
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
    this.abortActiveQueries();
  }
}
