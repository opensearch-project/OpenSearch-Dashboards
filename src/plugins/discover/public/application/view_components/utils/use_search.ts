/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef } from 'react';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { useEffect } from 'react';
import { DiscoverServices } from '../../../build_services';
import { search } from '../../../../../data/public';
import { validateTimeRange } from '../../helpers/validate_time_range';
import { createSearchSource } from './create_search_source';
import { useIndexPattern } from './use_index_pattern';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TimechartHeaderBucketInterval } from '../../components/timechart_header';
import { tabifyAggResponse } from '../../../opensearch_dashboards_services';
import {
  getDimensions,
  buildPointSeriesData,
  createHistogramConfigs,
  Chart,
} from '../../components/chart/utils';

export enum FetchStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface SearchData {
  status: FetchStatus;
  fetchCounter?: number;
  fieldCounts?: Record<string, number>;
  fetchError?: Error;
  hits?: number;
  rows?: OpenSearchSearchHit[];
  bucketInterval?: TimechartHeaderBucketInterval | {};
  chartData?: Chart | {};
}

export type SearchRefetch = 'refetch' | undefined;

export type DataSubject = BehaviorSubject<SearchData>;
export type RefetchSubject = Subject<SearchRefetch>;

/**
 * A hook that provides functionality for fetching and managing discover search data.
 * @returns { data: DataSubject, refetch$: RefetchSubject, indexPattern: IndexPattern } - data is a BehaviorSubject that emits the current search data, refetch$ is a Subject that can be used to trigger a refetch.
 * @example
 * const { data$, refetch$ } = useSearch();
 * useEffect(() => {
 *  const subscription = data$.subscribe((d) => {
 *   // do something with the data
 * });
 * return () => subscription.unsubscribe();
 * }, [data$]);
 */
export const useSearch = (services: DiscoverServices) => {
  const indexPattern = useIndexPattern();
  const { data, filterManager } = services;
  const timefilter = data.query.timefilter.timefilter;
  const fetchStateRef = useRef<{
    abortController: AbortController | undefined;
    fieldCounts: Record<string, number>;
    fetchStatus: FetchStatus;
  }>({
    abortController: undefined,
    fieldCounts: {},
    fetchStatus: FetchStatus.UNINITIALIZED,
  });

  const data$ = useMemo(
    () => new BehaviorSubject<SearchData>({ status: FetchStatus.UNINITIALIZED }),
    []
  );
  const refetch$ = useMemo(() => new Subject<SearchRefetch>(), []);

  const fetch = useCallback(async () => {
    if (!validateTimeRange(timefilter.getTime(), services.toastNotifications) || !indexPattern) {
      return Promise.reject();
    }

    if (fetchStateRef.current.abortController) fetchStateRef.current.abortController.abort();
    fetchStateRef.current.abortController = new AbortController();
    const sort = undefined;
    const histogramConfigs = indexPattern.timeFieldName
      ? createHistogramConfigs(indexPattern, 'auto', data)
      : undefined;
    const searchSource = await createSearchSource({
      indexPattern,
      services,
      sort,
      histogramConfigs,
    });

    try {
      const fetchResp = await searchSource.fetch({
        abortSignal: fetchStateRef.current.abortController.signal,
      });
      const hits = fetchResp.hits.total as number;
      const rows = fetchResp.hits.hits;
      let bucketInterval = {};
      let chartData = {};
      for (const row of rows) {
        const fields = Object.keys(indexPattern.flattenHit(row));
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
          chartData = buildPointSeriesData(tabifiedData, dimensions);
        }
      }

      fetchStateRef.current.fieldCounts = fetchStateRef.current.fieldCounts!;
      fetchStateRef.current.fetchStatus = FetchStatus.COMPLETE;
      data$.next({
        status: FetchStatus.COMPLETE,
        fieldCounts: fetchStateRef.current.fieldCounts,
        hits,
        rows,
        bucketInterval,
        chartData,
      });
    } catch (err) {
      // TODO: handle the error
    }
  }, [data$, timefilter, services, indexPattern, data]);

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
      (async () => {
        try {
          await fetch();
        } catch (error) {
          data$.next({
            status: FetchStatus.ERROR,
            fetchError: error as Error,
          });
        }
      })();
    });

    // kick off initial fetch
    refetch$.next();

    return () => {
      subscription.unsubscribe();
    };
  }, [data$, data.query.queryString, filterManager, refetch$, timefilter, fetch]);

  return {
    data$,
    refetch$,
    indexPattern,
  };
};

export type SearchContextValue = ReturnType<typeof useSearch>;
