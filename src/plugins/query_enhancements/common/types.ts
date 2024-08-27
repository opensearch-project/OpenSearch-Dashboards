/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';
import { Observable } from 'rxjs';

export interface QueryAggConfig {
  [key: string]: {
    field?: string;
    fixed_interval?: string;
    calendar_interval?: string;
    min_doc_count?: number;
    time_zone?: string;
    [x: number]: string;
  };
}

export interface EnhancedFetchContext {
  http: CoreSetup['http'];
  path: string;
  signal?: AbortSignal;
}

export type FetchFunction<T, P = void> = (params?: P) => Observable<T>;
