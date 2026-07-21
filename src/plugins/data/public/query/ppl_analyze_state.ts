/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';

/** A single node in the query execution operator tree. */
export interface PPLAnalyzeOperatorNode {
  node_type?: string[];
  source?: string;
  is_pushed_down?: boolean;
  estimated_rows?: number;
  actual_rows?: number;
  // Backend returns this as a formatted string with a unit (e.g. '2.70 ms');
  // the panel extracts the numeric value with parseFloat.
  actual_time_ms?: string;
}

/** A single optimization recommendation returned by the backend. */
export interface PPLAnalyzeRecommendation {
  rule?: string;
  severity?: string;
  message?: string;
  suggestion?: string;
  affected_node?: string;
}

/** Per-phase timing profile (analyze/optimize/execute/format). */
export interface PPLAnalyzeProfile {
  phases?: Record<string, { time_ms: number }>;
  summary?: {
    total_time_ms?: number;
  };
}

/**
 * Response body from the PPL analyze backend endpoint. On success it carries the
 * profile and operator tree; on failure the error fields are populated instead.
 */
export interface PPLAnalyzeResponse {
  profile?: PPLAnalyzeProfile;
  operator_tree?: PPLAnalyzeOperatorNode[];
  recommendations?: PPLAnalyzeRecommendation[];
  possibleCacheHit?: boolean;
  // Error shape (populated when the backend returns a 4xx/5xx or an error body).
  statusCode?: number;
  error?: string;
  message?: string;
}

export interface PPLAnalyzeResult {
  query: string;
  response: PPLAnalyzeResponse;
  injectedTimeFilter?: string;
}

const analyzeResult$ = new BehaviorSubject<PPLAnalyzeResult | null>(null);
const analyzeLoading$ = new BehaviorSubject<boolean>(false);
const analyzeOpen$ = new BehaviorSubject<boolean>(false);

export const getPPLAnalyzeResult$ = () => analyzeResult$;
export const getPPLAnalyzeLoading$ = () => analyzeLoading$;
export const getPPLAnalyzeOpen$ = () => analyzeOpen$;

export const isPPLAnalyzeOpen = () => analyzeOpen$.getValue();

export const setPPLAnalyzeResult = (result: PPLAnalyzeResult | null) => {
  analyzeResult$.next(result);
  analyzeLoading$.next(false);
};

export const setPPLAnalyzeLoading = (loading: boolean) => {
  analyzeLoading$.next(loading);
};

export const setPPLAnalyzeOpen = (open: boolean) => {
  analyzeOpen$.next(open);
};
