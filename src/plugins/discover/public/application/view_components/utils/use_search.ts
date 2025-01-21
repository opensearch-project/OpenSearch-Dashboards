/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { debounceTime, filter, pairwise } from 'rxjs/operators';
import { i18n } from '@osd/i18n';
import { useEffect } from 'react';
import { cloneDeep } from 'lodash';
import { useLocation } from 'react-router-dom';
import { useEffectOnce } from 'react-use';
import { RequestAdapter } from '../../../../../inspector/public';
import { DiscoverViewServices } from '../../../build_services';
import { search, UI_SETTINGS } from '../../../../../data/public';
import { validateTimeRange } from '../../helpers/validate_time_range';
import { updateSearchSource } from './update_search_source';
import { useIndexPattern } from './use_index_pattern';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TimechartHeaderBucketInterval } from '../../components/chart/timechart_header';
import { tabifyAggResponse } from '../../../opensearch_dashboards_services';
import {
  getDimensions,
  buildPointSeriesData,
  createHistogramConfigs,
  Chart,
} from '../../components/chart/utils';
import { SavedSearch } from '../../../saved_searches';
import { useSelector } from '../../utils/state_management';
import {
  getRequestInspectorStats,
  getResponseInspectorStats,
} from '../../../opensearch_dashboards_services';
import { SEARCH_ON_PAGE_LOAD_SETTING } from '../../../../common';
import { syncQueryStateWithUrl } from '../../../../../data/public';
import { trackQueryMetric } from '../../../ui_metric';

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
  hits?: number;
  rows?: OpenSearchSearchHit[];
  bucketInterval?: TimechartHeaderBucketInterval | {};
  chartData?: Chart;
  title?: string;
  queryStatus?: {
    body?: {
      error?: {
        reason?: string;
        details: string;
      };
      statusCode?: number;
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
  const [savedSearch, setSavedSearch] = useState<SavedSearch | undefined>(undefined);
  const { savedSearch: savedSearchId, sort, interval, savedQuery } = useSelector(
    (state) => state.discover
  );
  const indexPattern = useIndexPattern(services);
  const skipInitialFetch = useRef(false);
  const {
    data,
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
    rows?: OpenSearchSearchHit[];
  }>({
    abortController: undefined,
    fieldCounts: {},
  });
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
      const title = i18n.translate('discover.inspectorRequestDataTitle', {
        defaultMessage: 'data',
      });
      const description = i18n.translate('discover.inspectorRequestDescription', {
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

      // Execute the search
      const fetchResp = await searchSource.fetch({
        abortSignal: fetchStateRef.current.abortController.signal,
        withLongNumeralsSupport: await services.uiSettings.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS),
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
      let errorBody;
      try {
        errorBody = JSON.parse(error.body);
      } catch (e) {
        if (error.body) {
          errorBody = error.body;
        } else {
          errorBody = error;
        }
      }

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
    (async () => {
      const savedSearchInstance = await getSavedSearchById(savedSearchId);

      const query =
        savedSearchInstance.searchSource.getField('query') || data.query.queryString.getQuery();

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

      let actualFilters: any[] = [];

      if (savedQuery) {
        actualFilters = data.query.filterManager.getFilters();
      } else if (filters !== undefined) {
        const result = typeof filters === 'function' ? filters() : filters;
        if (result !== undefined) {
          actualFilters.push(...(Array.isArray(result) ? result : [result]));
        }
      }

      filterManager.setAppFilters(actualFilters);
      data.query.queryString.setQuery(query);
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
    })();
    // This effect will only run when getSavedSearchById is called, which is
    // only called when the component is first mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSavedSearchById, savedSearchId]);

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
  };
};

export type SearchContextValue = ReturnType<typeof useSearch>;
