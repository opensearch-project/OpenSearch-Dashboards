/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from '../store';
import { UIState, TabState, LegacyState, QueryState } from '../slices';

/**
 * Normalizes state by removing undefined properties recursively
 */
const normalizeState = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return (obj.map(normalizeState) as unknown) as T;
  }

  if (typeof obj === 'object') {
    const cleaned = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        (cleaned as any)[key] = normalizeState(value);
      }
    }
    return cleaned;
  }

  return obj;
};

/**
 * Normalizes query state
 */
export const normalizeQueryState = (queryState: QueryState): QueryState => {
  return normalizeState(queryState);
};

/**
 * Normalizes UI state
 */
export const normalizeUIState = (uiState: UIState): UIState => {
  return normalizeState(uiState);
};

/**
 * Normalizes tab state
 */
export const normalizeTabState = (tabState: TabState): TabState => {
  return normalizeState(tabState);
};

/**
 * Normalizes legacy state
 */
export const normalizeLegacyState = (legacyState: LegacyState): LegacyState => {
  return normalizeState(legacyState);
};

/**
 * Normalizes state for comparison
 */
export const normalizeStateForComparison = (state: RootState) => {
  return {
    query: normalizeQueryState(state.query),
    ui: normalizeUIState(state.ui),
    tab: normalizeTabState(state.tab),
    legacy: normalizeLegacyState(state.legacy),
  };
};
