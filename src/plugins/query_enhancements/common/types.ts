/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';
import { Observable } from 'rxjs';

export interface QueryAggConfig {
  [x: string]: string;
}

export interface EnhancedFetchContext {
  http: CoreSetup['http'];
  path: string;
  signal?: AbortSignal;
}

export type FetchFunction<T, P = void> = (params?: P) => Observable<T>;
