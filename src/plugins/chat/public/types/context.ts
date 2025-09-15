/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ContextType {
  TIME_RANGE = 'time_range',
  FILTERS = 'filters',
  QUERY = 'query',
  INDEX_PATTERN = 'index_pattern',
  DASHBOARD = 'dashboard',
  VISUALIZATION = 'visualization',
  SAVED_SEARCH = 'saved_search',
  DOCUMENT = 'document',
  FIELD = 'field',
  APP_STATE = 'app_state',
}

export interface ContextItem {
  id: string;
  type: ContextType;
  label: string;
  data: any;
  isPinned?: boolean;
  source?: 'static' | 'dynamic';
  timestamp: number;
}

export interface ContextState {
  activeContexts: ContextItem[];
  pinnedContextIds: Set<string>;
}

export interface ContextColors {
  [ContextType.TIME_RANGE]: string;
  [ContextType.FILTERS]: string;
  [ContextType.QUERY]: string;
  [ContextType.INDEX_PATTERN]: string;
  [ContextType.DASHBOARD]: string;
  [ContextType.VISUALIZATION]: string;
  [ContextType.SAVED_SEARCH]: string;
  [ContextType.DOCUMENT]: string;
  [ContextType.FIELD]: string;
  [ContextType.APP_STATE]: string;
}

export const CONTEXT_COLORS: ContextColors = {
  [ContextType.TIME_RANGE]: '#54B2B5',
  [ContextType.FILTERS]: '#6092C0',
  [ContextType.QUERY]: '#9170B8',
  [ContextType.INDEX_PATTERN]: '#CA8EAE',
  [ContextType.DASHBOARD]: '#F5A35C',
  [ContextType.VISUALIZATION]: '#D97E6C',
  [ContextType.SAVED_SEARCH]: '#E7664C',
  [ContextType.DOCUMENT]: '#D6BF57',
  [ContextType.FIELD]: '#8BC889',
  [ContextType.APP_STATE]: '#B9A888',
};

export const SINGLETON_CONTEXT_TYPES = new Set([
  ContextType.TIME_RANGE,
  ContextType.QUERY,
  ContextType.INDEX_PATTERN,
  ContextType.APP_STATE,
]);
