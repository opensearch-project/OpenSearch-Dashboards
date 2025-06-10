/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import uuid from 'uuid';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { debounceTime, filter, pairwise } from 'rxjs/operators';
import { i18n } from '@osd/i18n';
import { cloneDeep } from 'lodash';
import { useLocation } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { RequestAdapter } from '../../../../../../../../inspector/public';
import { DiscoverViewServices } from '../../../build_services';
import { search, syncQueryStateWithUrl, UI_SETTINGS } from '../../../../../../../../data/public';
import { validateTimeRange } from '../../helpers/validate_time_range';
import { updateSearchSource } from './update_search_source';
import { useIndexPattern } from './use_index_pattern';
import { OpenSearchSearchHit } from '../../../../../../types/doc_views_types';
import { TimechartHeaderBucketInterval } from '../../components/chart/timechart_header';
import {
  getRequestInspectorStats,
  getResponseInspectorStats,
  tabifyAggResponse,
  IFieldType,
} from '../../../opensearch_dashboards_services';
import {
  buildPointSeriesData,
  Chart,
  createHistogramConfigs,
  getDimensions,
} from '../../components/chart/utils';
import { SavedExplore } from '../../../../../../saved_explore';
import { useSelector } from '../../utils/state_management';
import { SEARCH_ON_PAGE_LOAD_SETTING } from '../../../../../../../common/legacy/discover';
import { trackQueryMetric } from '../../../ui_metric';

import { ABORT_DATA_QUERY_TRIGGER } from '../../../../../../../../ui_actions/public';
import {
  ACTION_ABORT_DATA_QUERY,
  AbortDataQueryContext,
  createAbortDataQueryAction,
} from '../../../actions/abort_data_query_action';

declare module '../../../../../../../../ui_actions/public' {
  export interface TriggerContextMapping {
    [ABORT_DATA_QUERY_TRIGGER]: AbortDataQueryContext;
  }
  export interface ActionContextMapping {
    [ACTION_ABORT_DATA_QUERY]: AbortDataQueryContext;
  }
}

export function safeJSONParse(text: any) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

export enum ResultStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading', // initial data load
  READY = 'ready', // results came back
  NO_RESULTS = 'none', // no results came back
  ERROR = 'error', // error occurred
}

export interface SearchData {
  status: ResultStatus;
  fetchCounter?: number;
  fieldCounts?: Record<string, number>;
  fieldSchema?: Array<Partial<IFieldType>>;
  hits?: number;
  rows?: Array<OpenSearchSearchHit<Record<string, any>>>;
  bucketInterval?: TimechartHeaderBucketInterval | {};
  chartData?: Chart;
  title?: string;
  queryStatus?: {
    body?: {
      error?: {
        error?: string;
        message?: {
          error?:
            | string
            | {
                reason?: string;
                details: string;
                type?: string;
              };
          status?: number;
        };
        statusCode?: number;
      };
    };
    elapsedMs?: number;
    startTime?: number;
  };
}

export type SearchRefetch = 'refetch' | undefined;

export type DataSubject = BehaviorSubject<SearchData>;
export type RefetchSubject = Subject<SearchRefetch>;

/**
 * A hook that provides functionality for fetching and managing discover search data.
 * @returns { data: DataSubject, refetch$: RefetchSubject, indexPattern: IndexPattern, savedSearch?: SavedSearch, inspectorAdapters } - data is a BehaviorSubject that emits the current search data, refetch$ is a Subject that can be used to trigger a refetch, savedSearch is the saved search object if it exists
 * @example
 * const { data$, refetch$ } = useSearch();
 * useEffect(() => {
 *  const subscription = data$.subscribe((d) => {
 *   // do something with the data
 * });
 * return () => subscription.unsubscribe();
 * }, [data$]);
 */
export const useSearch = (services: DiscoverViewServices) => {
  const { pathname } = useLocation();
  const initalSearchComplete = useRef(false);
  const [savedSearch, setSavedSearch] = useState<SavedExplore | undefined>(undefined);
  const {
    savedSearch: savedSearchId,
    sort,
    interval,
    savedQuery,
    saveExploreLoadCount,
  } = useSelector((state) => state.logs);
  const indexPattern = useIndexPattern(services);
  const skipInitialFetch = useRef(false);
  const {
    data,
    uiActions,
    filterManager,
    getSavedSearchById,
    core,
    toastNotifications,
    osdUrlStateStorage,
    chrome,
    uiSettings,
  } = services;
  const timefilter = data.query.timefilter.timefilter;
  const fetchStateRef = useRef<{
    abortController: AbortController | undefined;
    fieldCounts: Record<string, number>;
    fieldSchema: Record<string, string>;
    rows?: OpenSearchSearchHit[];
  }>({
    abortController: undefined,
    fieldCounts: {},
    fieldSchema: {},
  });
  const fetchForMaxCsvStateRef = useRef<{ abortController: AbortController | undefined }>({
    abortController: undefined,
  });

  const actionId = useRef(`ACTION_ABORT_DATA_QUERY_${uuid.v4()}`);

  const inspectorAdapters = {
    requests: new RequestAdapter(),
  };

  const shouldSearchOnPageLoad = useCallback(() => {
    // Checks the searchOnpageLoadPreference for the current dataset if not specifed defaults to UI Settings
    const { queryString } = data.query;
    const { dataset } = queryString.getQuery();
    const typeConfig = dataset ? queryString.getDatasetService().getType(dataset.type) : undefined;
    const datasetPreference =
      typeConfig?.meta?.searchOnLoad ?? uiSettings.get(SEARCH_ON_PAGE_LOAD_SETTING);

    // A saved search is created on every page load, so we check the ID to see if we're loading a
    // previously saved search or if it is just transient
    return (
      datasetPreference ||
      uiSettings.get(SEARCH_ON_PAGE_LOAD_SETTING) ||
      savedSearch?.id !== undefined ||
      timefilter.getRefreshInterval().pause === false
    );
  }, [data.query, savedSearch, uiSettings, timefilter]);

  const startTime = Date.now();
  const data$ = useMemo(
    () =>
      new BehaviorSubject<SearchData>({
        status:
          shouldSearchOnPageLoad() && !skipInitialFetch.current
            ? ResultStatus.LOADING
            : ResultStatus.UNINITIALIZED,
        queryStatus: { startTime },
      }),
    // we only want data$ observable to be created once, updates will be done through useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // re-initialize data$ when the selected dataset changes
  useEffectOnce(() => {
    const subscription = data.query.queryString
      .getUpdates$()
      .pipe(
        pairwise(),
        filter(([prev, curr]) => prev.dataset?.id !== curr.dataset?.id)
      )
      .subscribe(() => {
        data$.next({
          status:
            shouldSearchOnPageLoad() && !skipInitialFetch.current
              ? ResultStatus.LOADING
              : ResultStatus.UNINITIALIZED,
          queryStatus: { startTime },
          rows: [],
        });
      });
    return () => subscription.unsubscribe();
  });

  useEffect(() => {
    const id = actionId.current;
    uiActions.addTriggerAction(
      ABORT_DATA_QUERY_TRIGGER,
      createAbortDataQueryAction([fetchForMaxCsvStateRef, fetchStateRef], id)
    );
    return () => {
      uiActions.detachAction(ABORT_DATA_QUERY_TRIGGER, id);
    };
  }, [uiActions]);

  useEffect(() => {
    data$.next({ ...data$.value, queryStatus: { startTime } });
  }, [data$, startTime]);

  useEffect(() => {
    data$.next({
      ...data$.value,
      status:
        shouldSearchOnPageLoad() && !skipInitialFetch.current
          ? ResultStatus.LOADING
          : ResultStatus.UNINITIALIZED,
    });
  }, [data$, shouldSearchOnPageLoad, skipInitialFetch]);

  const refetch$ = useMemo(() => new Subject<SearchRefetch>(), []);

  const fetch = useCallback(async () => {
    const currentTime = Date.now();
    let dataset = indexPattern;
    if (!dataset) {
      data$.next({
        status: shouldSearchOnPageLoad() ? ResultStatus.LOADING : ResultStatus.UNINITIALIZED,
        queryStatus: { startTime: currentTime },
      });
      return;
    }

    if (!validateTimeRange(timefilter.getTime(), toastNotifications)) {
      return data$.next({
        status: ResultStatus.NO_RESULTS,
        rows: [],
      });
    }

    // Abort any in-progress requests before fetching again
    if (fetchStateRef.current.abortController) fetchStateRef.current.abortController.abort();
    fetchStateRef.current.abortController = new AbortController();
    const histogramConfigs = dataset.timeFieldName
      ? createHistogramConfigs(dataset, interval || 'auto', data)
      : undefined;
    const searchSource = await updateSearchSource({
      indexPattern: dataset,
      services,
      sort,
      searchSource: savedSearch?.searchSource,
      histogramConfigs,
    });

    dataset = searchSource.getField('index');

    let elapsedMs;
    try {
      data$.next({ status: ResultStatus.LOADING, queryStatus: { startTime: currentTime } });

      // Initialize inspect adapter for search source
      inspectorAdapters.requests.reset();
      const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
        defaultMessage: 'data',
      });
      const description = i18n.translate('explore.discover.inspectorRequestDescription', {
        defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
      });
      const inspectorRequest = inspectorAdapters.requests.start(title, { description });
      inspectorRequest.stats(getRequestInspectorStats(searchSource));
      searchSource.getSearchRequestBody().then((body: object) => {
        inspectorRequest.json(body);
      });

      // Track the dataset type and language used
      const query = searchSource.getField('query');
      if (query && query.dataset?.type && query.language) {
        trackQueryMetric(query);
      }

      const languageConfig = data.query.queryString
        .getLanguageService()
        .getLanguage(query!.language);

      // Execute the search
      const fetchResp = await searchSource.fetch({
        abortSignal: fetchStateRef.current.abortController.signal,
        withLongNumeralsSupport: await services.uiSettings.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS),
        ...(languageConfig &&
          languageConfig.fields?.formatter && {
            formatter: languageConfig.fields.formatter,
          }),
      });

      inspectorRequest
        .stats(getResponseInspectorStats(fetchResp, searchSource))
        .ok({ json: fetchResp });
      const hits = fetchResp.hits.total as number;
      const rows = fetchResp.hits.hits;
      elapsedMs = inspectorRequest.getTime();
      let bucketInterval = {};
      let chartData;
      for (const row of rows) {
        const fields = Object.keys(dataset!.flattenHit(row));
        for (const fieldName of fields) {
          fetchStateRef.current.fieldCounts[fieldName] =
            (fetchStateRef.current.fieldCounts[fieldName] || 0) + 1;
        }
      }

      if (histogramConfigs) {
        const bucketAggConfig = histogramConfigs.aggs[1];
        const tabifiedData = tabifyAggResponse(histogramConfigs, fetchResp);
        const dimensions = getDimensions(histogramConfigs, data);
        if (dimensions) {
          if (bucketAggConfig && search.aggs.isDateHistogramBucketAggConfig(bucketAggConfig)) {
            bucketInterval = bucketAggConfig.buckets?.getInterval();
          }
          // @ts-ignore tabifiedData is compatible but due to the way it is typed typescript complains
          chartData = buildPointSeriesData(tabifiedData, dimensions);
        }
      }

      fetchStateRef.current.fieldCounts = fetchStateRef.current.fieldCounts!;
      fetchStateRef.current.rows = rows;
      data$.next({
        status: rows.length > 0 ? ResultStatus.READY : ResultStatus.NO_RESULTS,
        fieldCounts: fetchStateRef.current.fieldCounts,
        fieldSchema: searchSource.getDataFrame()?.schema,
        hits,
        rows,
        bucketInterval,
        chartData,
        title:
          indexPattern?.title !== searchSource.getDataFrame()?.name
            ? searchSource.getDataFrame()?.name
            : indexPattern?.title,
        queryStatus: {
          elapsedMs,
        },
      });
    } catch (error: any) {
      // If the request was aborted then no need to surface this error in the UI
      if (error instanceof Error && error.name === 'AbortError') return;

      const queryLanguage = data.query.queryString.getQuery().language;
      if (queryLanguage === 'kuery' || queryLanguage === 'lucene') {
        data$.next({
          status: ResultStatus.NO_RESULTS,
          rows: [],
        });

        data.search.showError(error as Error);
        return;
      }
      // TODO: Create a unify error response at server side
      let errorBody;
      try {
        // Normal search strategy failed query, return HttpFetchError
        /*
          @type {HttpFetchError}
          {
            body: {
              error: string,
              statusCode: number,
              message: JSONstring,
            },
            ...
          }
        */
        errorBody = JSON.parse(error.body);
      } catch (e) {
        if (error.body) {
          errorBody = error.body;
        } else {
          // Async search strategy failed query, return Error
          /*
            @type {Error}
            {
              message: string,
              stack: string,
            }
          */
          errorBody = error;
        }
      }

      // Error message can be sent as encoded JSON string, which requires extra parsing
      /*
        errorBody: {
          error: string,
          statusCode: number,
          message: {
            error: {
              reason: string;
              details: string;
              type: string;
            };
            status: number;
          }
        }
      */
      errorBody.message = safeJSONParse(errorBody.message);

      data$.next({
        status: ResultStatus.ERROR,
        queryStatus: {
          body: { error: errorBody },
          elapsedMs,
        },
      });
    } finally {
      initalSearchComplete.current = true;
    }
  }, [
    indexPattern,
    timefilter,
    toastNotifications,
    interval,
    data,
    services,
    sort,
    savedSearch?.searchSource,
    data$,
    shouldSearchOnPageLoad,
    inspectorAdapters.requests,
  ]);

  // This is a modified version of the above fetch that is to be used for CSV Download MAX option.
  const fetchForMaxCsvOption = useCallback(
    async (size: number) => {
      const dataset = indexPattern;
      if (!dataset) {
        throw new Error('Dataset not found');
      }

      if (!validateTimeRange(timefilter.getTime(), toastNotifications)) {
        throw new Error('Invalid time range');
      }

      // Abort any in-progress requests before fetching again
      if (fetchForMaxCsvStateRef.current.abortController)
        fetchForMaxCsvStateRef.current.abortController.abort();
      fetchForMaxCsvStateRef.current.abortController = new AbortController();

      const searchSource = await updateSearchSource({
        indexPattern: dataset,
        services,
        sort,
        searchSource: savedSearch?.searchSource,
        histogramConfigs: undefined,
        size,
      });

      const query = searchSource.getField('query');
      const languageConfig = data.query.queryString
        .getLanguageService()
        .getLanguage(query!.language);

      // Execute the search
      const fetchResp = await searchSource.fetch({
        abortSignal: fetchForMaxCsvStateRef.current.abortController.signal,
        withLongNumeralsSupport: await services.uiSettings.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS),
        ...(languageConfig &&
          languageConfig.fields?.formatter && {
            formatter: languageConfig.fields.formatter,
          }),
      });

      return fetchResp.hits.hits;
    },
    [
      indexPattern,
      timefilter,
      toastNotifications,
      services,
      sort,
      savedSearch?.searchSource,
      data.query.queryString,
    ]
  );

  useEffect(() => {
    const fetch$ = merge(
      refetch$,
      filterManager.getFetches$(),
      timefilter.getFetch$(),
      timefilter.getTimeUpdate$(),
      timefilter.getAutoRefreshFetch$(),
      data.query.queryString.getUpdates$()
    ).pipe(debounceTime(100));

    const subscription = fetch$.subscribe(() => {
      if (skipInitialFetch.current) {
        skipInitialFetch.current = false; // Reset so future fetches will proceed normally
        return; // Skip the first fetch
      }

      (async () => {
        try {
          await fetch();
        } catch (error) {
          core.fatalErrors.add(error as Error);
        }
      })();
    });

    // kick off initial refetch on page load
    if (shouldSearchOnPageLoad() || initalSearchComplete.current === true) {
      refetch$.next();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [
    data$,
    data.query.queryString,
    filterManager,
    refetch$,
    timefilter,
    fetch,
    core.fatalErrors,
    shouldSearchOnPageLoad,
  ]);

  // Get savedSearch if it exists
  useEffect(() => {
    const loadSavedSearch = async () => {
      const savedSearchInstance = await getSavedSearchById(savedSearchId);
      const dataQuery = data.query.queryString.getQuery();
      const defaultQuery = data.query.queryString.getDefaultQuery();
      const isDataQueryDefault = dataQuery.query === defaultQuery.query;
      const savedSearchQuery = savedSearchInstance.searchSource.getField('query');

      // Use eixisting query, if eixisting query match default, use query from saved search
      const query = isDataQueryDefault ? savedSearchQuery ?? dataQuery : dataQuery;

      const isEnhancementsEnabled = await uiSettings.get('query:enhancements:enabled');
      if (isEnhancementsEnabled && query.dataset) {
        let pattern = await data.indexPatterns.get(
          query.dataset.id,
          query.dataset.type !== 'INDEX_PATTERN'
        );
        if (!pattern) {
          await data.query.queryString.getDatasetService().cacheDataset(query.dataset, {
            uiSettings: services.uiSettings,
            savedObjects: services.savedObjects,
            notifications: services.notifications,
            http: services.http,
            data: services.data,
          });
          pattern = await data.indexPatterns.get(
            query.dataset.id,
            query.dataset.type !== 'INDEX_PATTERN'
          );
          savedSearchInstance.searchSource.setField('index', pattern);
        }
      }

      // sync initial app filters from savedObject to filterManager
      const filters = cloneDeep(savedSearchInstance.searchSource.getOwnField('filter'));

      // merge filters in saved search with exisiting filters in filterManager
      const actualFilters = cloneDeep(filterManager.getAppFilters());

      if (savedQuery) {
        actualFilters.push.apply(actualFilters, data.query.filterManager.getFilters());
      } else if (filters !== undefined) {
        const result = typeof filters === 'function' ? filters() : filters;
        if (result !== undefined) {
          actualFilters.push(...(Array.isArray(result) ? result : [result]));
        }
      }

      filterManager.setAppFilters(actualFilters);
      data.query.queryString.setQuery(query);
      // Update local storage after loading saved search
      data.query.queryString.getLanguageService().setUserQueryLanguage(query.language);
      data.query.queryString.getInitialQueryByLanguage(query.language);
      setSavedSearch(savedSearchInstance);

      if (savedSearchInstance?.id) {
        chrome.recentlyAccessed.add(
          savedSearchInstance.getFullPath(),
          savedSearchInstance.title,
          savedSearchInstance.id,
          {
            type: savedSearchInstance.getOpenSearchType(),
          }
        );
      }
    };

    loadSavedSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSavedSearchById, savedSearchId, saveExploreLoadCount]);

  useEffect(() => {
    // syncs `_g` portion of url with query services
    const { stop } = syncQueryStateWithUrl(data.query, osdUrlStateStorage, uiSettings);

    return () => stop();

    // this effect should re-run when pathname is changed to preserve querystring part,
    // so the global state is always preserved
  }, [data.query, osdUrlStateStorage, pathname, uiSettings]);

  return {
    data$,
    refetch$,
    indexPattern,
    savedSearch,
    inspectorAdapters,
    fetchForMaxCsvOption,
    fetchForMaxCsvStateRef,
  };
};

export type SearchContextValue = ReturnType<typeof useSearch>;
