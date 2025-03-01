/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

type FetchFunction<T, P = void> = (params?: P) => Promise<T>;

export interface PollingConfigurations {
  tabId: string;
}

export class UsePolling<T, P = void> {
  public data: T | null = null;
  public error: Error | null = null;
  public loading: boolean = true;
  private shouldPoll: boolean = false;
  private intervalRef?: NodeJS.Timeout;

  constructor(
    private fetchFunction: FetchFunction<T, P>,
    private interval: number = 5000,
    private onPollingSuccess?: (data: T, configurations: PollingConfigurations) => boolean,
    private onPollingError?: (error: Error) => boolean,
    private configurations?: PollingConfigurations
  ) {}

  async fetchData(params?: P) {
    this.loading = true;
    try {
      const result = await this.fetchFunction(params);
      this.data = result;
      this.loading = false;

      if (this.onPollingSuccess && this.onPollingSuccess(result, this.configurations!)) {
        this.stopPolling();
      }
    } catch (err) {
      this.error = err as Error;
      this.loading = false;

      if (this.onPollingError && this.onPollingError(this.error)) {
        this.stopPolling();
      }
    }
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
      clearInterval((this.intervalRef as unknown) as NodeJS.Timeout);
      this.intervalRef = undefined;
    }
  }
}

interface UsePollingReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  startPolling: (params?: any) => void;
  stopPolling: () => void;
}

export function usePolling<T, P = void>(
  fetchFunction: FetchFunction<T, P>,
  interval: number = 5000,
  onPollingSuccess?: (data: T, configurations: PollingConfigurations) => boolean,
  onPollingError?: (error: Error) => boolean,
  configurations?: PollingConfigurations
): UsePollingReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | string | number | undefined>(undefined);
  const unmounted = useRef<boolean>(false);

  const shouldPoll = useRef(false);

  const startPolling = (params?: P) => {
    shouldPoll.current = true;
    const intervalId = setInterval(() => {
      if (shouldPoll.current) {
        fetchData(params);
      }
    }, interval);
    intervalRef.current = intervalId;
    if (unmounted.current) {
      clearInterval((intervalId as unknown) as NodeJS.Timeout);
    }
  };

  const stopPolling = () => {
    shouldPoll.current = false;
    clearInterval((intervalRef.current as unknown) as NodeJS.Timeout);
  };

  const fetchData = async (params?: P) => {
    try {
      const result = await fetchFunction(params);
      setData(result);
      // Check the success condition and stop polling if it's met
      if (onPollingSuccess && onPollingSuccess(result, configurations)) {
        stopPolling();
      }
    } catch (err: unknown) {
      setError(err as Error);

      // Check the error condition and stop polling if it's met
      if (onPollingError && onPollingError(err as Error)) {
        stopPolling();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  return { data, loading, error, startPolling, stopPolling };
}
