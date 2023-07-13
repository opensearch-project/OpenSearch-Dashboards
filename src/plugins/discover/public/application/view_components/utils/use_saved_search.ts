/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef } from 'react';
import { ISearchSource, IndexPattern } from 'src/plugins/data/public';
import { BehaviorSubject, Subject, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { useEffect } from 'react';
import { DiscoverServices } from '../../../build_services';

import { validateTimeRange } from '../../../application/helpers/validate_time_range';
import { updateDataSource } from './update_data_source';

export enum FetchStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface SavedSearchData {
  status: FetchStatus;
  fetchCounter?: number;
  fieldCounts?: Record<string, number>;
  fetchError?: Error;
  hits?: number;
  rows?: any[]; // ToDo: type
}

export type SavedSearchRefetch = 'refetch' | undefined;

export type DataSubject = BehaviorSubject<SavedSearchData>;
export type RefetchSubject = BehaviorSubject<SavedSearchRefetch>;

export const useSavedSearch = ({
  indexPattern,
  searchSource,
  services,
}: {
  indexPattern: IndexPattern;
  searchSource: ISearchSource;
  services: DiscoverServices;
}) => {
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
    () => new BehaviorSubject<any>({ state: FetchStatus.UNINITIALIZED }),
    []
  );
  const refetch$ = useMemo(() => new Subject<any>(), []);

  const fetch = useCallback(async () => {
    if (!validateTimeRange(timefilter.getTime(), services.toastNotifications)) {
      return Promise.reject();
    }

    if (fetchStateRef.current.abortController) fetchStateRef.current.abortController.abort();
    fetchStateRef.current.abortController = new AbortController();
    const sort = undefined;
    const updatedSearchSource = updateDataSource({ searchSource, indexPattern, services, sort });

    try {
      const fetchResp = await updatedSearchSource.fetch({
        abortSignal: fetchStateRef.current.abortController.signal,
      });
      const hits = fetchResp.hits.total as number;
      const rows = fetchResp.hits.hits;
      for (const row of rows) {
        const fields = Object.keys(indexPattern.flattenHit(row));
        for (const fieldName of fields) {
          fetchStateRef.current.fieldCounts[fieldName] =
            (fetchStateRef.current.fieldCounts[fieldName] || 0) + 1;
        }
      }
      fetchStateRef.current.fieldCounts = fetchStateRef.current.fieldCounts!;
      fetchStateRef.current.fetchStatus = FetchStatus.COMPLETE;
      data$.next({
        status: FetchStatus.COMPLETE,
        fieldCounts: fetchStateRef.current.fieldCounts,
        hits,
        rows,
      });
    } catch (err) {
      // ToDo: handle the error
    }
  }, [data$, timefilter, services, searchSource, indexPattern, fetchStateRef]);

  useEffect(() => {
    const fetch$ = merge(
      refetch$,
      filterManager.getFetches$(),
      timefilter.getFetch$(),
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
            fetchError: error,
          });
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [data$, data.query.queryString, filterManager, refetch$, timefilter, fetch]);

  return {
    data$,
    refetch$,
  };
};
