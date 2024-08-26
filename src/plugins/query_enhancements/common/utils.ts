/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataFrame, Query } from 'src/plugins/data/common';
import { Observable, Subscription, from, throwError, timer } from 'rxjs';
import { catchError, concatMap, last, takeWhile, tap } from 'rxjs/operators';
import { FetchDataFrameContext, FetchFunction } from './types';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return (
    date.getFullYear() +
    '-' +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + date.getDate()).slice(-2) +
    ' ' +
    ('0' + date.getHours()).slice(-2) +
    ':' +
    ('0' + date.getMinutes()).slice(-2) +
    ':' +
    ('0' + date.getSeconds()).slice(-2)
  );
};

export const getFields = (rawResponse: any) => {
  return rawResponse.data.schema?.map((field: any, index: any) => ({
    ...field,
    values: rawResponse.data.datarows?.map((row: any) => row[index]),
  }));
};

export const removeKeyword = (queryString: string | undefined) => {
  return queryString?.replace(new RegExp('.keyword'), '') ?? '';
};

export class DataFramePolling<T, P = void> {
  public data: T | null = null;
  public error: Error | null = null;
  public loading: boolean = true;
  private shouldPoll: boolean = false;
  private intervalRef?: NodeJS.Timeout;
  private subscription?: Subscription;

  constructor(
    private fetchFunction: FetchFunction<T, P>,
    private interval: number = 5000,
    private onPollingSuccess: (data: T) => boolean,
    private onPollingError: (error: Error) => boolean
  ) {}

  fetch(): Observable<T> {
    return timer(0, this.interval).pipe(
      concatMap(() => this.fetchFunction()),
      takeWhile((resp) => this.onPollingSuccess(resp), true),
      tap((resp: T) => {
        this.data = resp;
      }),
      last(),
      catchError((error: Error) => {
        this.onPollingError(error);
        return throwError(error);
      })
    );
  }

  fetchData(params?: P) {
    this.loading = true;
    this.subscription = this.fetchFunction(params).subscribe({
      next: (result: any) => {
        this.data = result;
        this.loading = false;

        if (this.onPollingSuccess && this.onPollingSuccess(result)) {
          this.stopPolling();
        }
      },
      error: (err: any) => {
        this.error = err as Error;
        this.loading = false;

        if (this.onPollingError && this.onPollingError(this.error)) {
          this.stopPolling();
        }
      },
    });
  }

  startPolling(params?: P) {
    this.shouldPoll = true;
    if (!this.intervalRef) {
      this.intervalRef = setInterval(() => {
        if (this.shouldPoll) {
          this.fetchData(params);
        }
      }, this.interval);
    }
  }

  stopPolling() {
    this.shouldPoll = false;
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = undefined;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  waitForPolling(): Promise<void> {
    return new Promise<any>((resolve) => {
      const checkLoading = () => {
        if (!this.loading) {
          resolve(this.data);
        } else {
          setTimeout(checkLoading, this.interval);
        }
      };
      checkLoading();
    });
  }
}

export const handleDataFrameError = (response: any) => {
  const df = response.body;
  if (df.error) {
    const jsError = new Error(df.error.response);
    return throwError(jsError);
  }
};

export const fetchDataFrame = (context: FetchDataFrameContext, query: Query, df: IDataFrame) => {
  const { http, path, signal } = context;
  const body = JSON.stringify({ query: { ...query, format: 'jdbc' }, df });
  return from(
    http.fetch({
      method: 'POST',
      path,
      body,
      signal,
    })
  ).pipe(tap(handleDataFrameError));
};

export const fetchDataFramePolling = (context: FetchDataFrameContext, df: IDataFrame) => {
  const { http, path, signal } = context;
  const queryId = df.meta?.queryId;
  const dataSourceId = df.meta?.queryConfig?.dataSourceId;
  return from(
    http.fetch({
      method: 'GET',
      path: `${path}/${queryId}${dataSourceId ? `/${dataSourceId}` : ''}`,
      signal,
    })
  );
};
