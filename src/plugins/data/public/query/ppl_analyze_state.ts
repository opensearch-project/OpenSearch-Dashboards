/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';

export interface PPLAnalyzeResult {
  query: string;
  response: any;
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
