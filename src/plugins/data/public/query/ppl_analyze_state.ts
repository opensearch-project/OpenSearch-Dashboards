/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';

/**
 * A single optimization recommendation returned by the backend. The backend's
 * contract for `recommendations` has changed over time (it currently declares a
 * `List<String>`), so a recommendation may arrive either as this object or as a
 * bare string. Consumers must normalize before reading fields — see
 * `normalizeRecommendation` in the panel.
 */
export interface PPLAnalyzeRecommendation {
  rule?: string;
  severity?: string;
  message?: string;
  suggestion?: string;
  affected_node?: string;
}

/**
 * A single physical-plan node from the backend profile. The panel reconstructs
 * the execution waterfall from this nested plan tree, where each node's time_ms
 * is inclusive of its children's time.
 */
export interface PPLAnalyzePlanNode {
  node: string;
  time_ms?: number;
  rows?: number;
  children?: PPLAnalyzePlanNode[];
}

/** Per-phase timing profile (analyze/optimize/execute/format). */
export interface PPLAnalyzeProfile {
  phases?: Record<string, { time_ms: number }>;
  summary?: {
    total_time_ms?: number;
  };
  // The physical execution plan the panel renders the waterfall from.
  plan?: PPLAnalyzePlanNode;
}

/**
 * Response body from the PPL analyze backend endpoint. On success it carries the
 * profile; on failure the error fields are populated instead.
 */
export interface PPLAnalyzeResponse {
  profile?: PPLAnalyzeProfile;
  // May be objects or bare strings depending on the backend version; normalize
  // before use rather than assuming the object shape.
  recommendations?: Array<PPLAnalyzeRecommendation | string>;
  // Error shape (populated when the backend returns a 4xx/5xx or an error body).
  statusCode?: number;
  error?: string;
  message?: string;
}

export interface PPLAnalyzeResult {
  query: string;
  response: PPLAnalyzeResponse;
}

const analyzeResult$ = new BehaviorSubject<PPLAnalyzeResult | null>(null);
const analyzeLoading$ = new BehaviorSubject<boolean>(false);
const analyzeOpen$ = new BehaviorSubject<boolean>(false);

export const getPPLAnalyzeResult$ = () => analyzeResult$;
export const getPPLAnalyzeLoading$ = () => analyzeLoading$;

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

/**
 * Clears any displayed analyze result and resets loading. Call when the panel is
 * closed or the page unmounts so a stale result from a previous query doesn't
 * reappear the next time the panel opens.
 */
export const clearPPLAnalyzeResult = () => {
  analyzeResult$.next(null);
  analyzeLoading$.next(false);
};
