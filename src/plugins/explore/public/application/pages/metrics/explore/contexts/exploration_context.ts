/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from 'react';
import {
  ExplorationState,
  ExplorationLevel,
  LabelFilter,
  GroupingStrategy,
  LayoutMode,
} from '../types';
import { PrometheusClient } from '../services/prometheus_client';
import { MetricQueryGenerator } from '../services/query_generator';

export const defaultState: ExplorationState = {
  level: ExplorationLevel.BROWSER,
  search: '',
  metric: '',
  label: '',
  filters: [],
  grouping: GroupingStrategy.ALPHABETICAL,
  layout: LayoutMode.GRID,
};

type Action =
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SELECT_METRIC'; metric: string }
  | { type: 'SELECT_LABEL'; label: string }
  | { type: 'ADD_FILTER'; filter: LabelFilter }
  | { type: 'REMOVE_FILTER'; index: number }
  | { type: 'TOGGLE_FILTER'; index: number }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_GROUPING'; grouping: GroupingStrategy }
  | { type: 'SET_LAYOUT'; layout: LayoutMode }
  | { type: 'GO_BACK' }
  | { type: 'RESTORE'; state: Partial<ExplorationState> };

export function explorationReducer(state: ExplorationState, action: Action): ExplorationState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.search };
    case 'SELECT_METRIC':
      return { ...state, metric: action.metric, level: ExplorationLevel.DETAIL, label: '' };
    case 'SELECT_LABEL':
      return { ...state, label: action.label, level: ExplorationLevel.BREAKDOWN };
    case 'ADD_FILTER':
      return { ...state, filters: [...state.filters, action.filter] };
    case 'REMOVE_FILTER':
      return { ...state, filters: state.filters.filter((_, i) => i !== action.index) };
    case 'TOGGLE_FILTER':
      return {
        ...state,
        filters: state.filters.map((f, i) =>
          i === action.index ? { ...f, enabled: f.enabled === false ? true : false } : f
        ),
      };
    case 'CLEAR_FILTERS':
      return { ...state, filters: [] };
    case 'SET_GROUPING':
      return { ...state, grouping: action.grouping };
    case 'SET_LAYOUT':
      return { ...state, layout: action.layout };
    case 'GO_BACK':
      if (state.level === ExplorationLevel.BREAKDOWN)
        return { ...state, level: ExplorationLevel.DETAIL, label: '' };
      if (state.level === ExplorationLevel.DETAIL)
        return { ...state, level: ExplorationLevel.BROWSER, metric: '' };
      return state;
    case 'RESTORE':
      return { ...state, ...action.state };
    default:
      return state;
  }
}

interface ExplorationContextValue {
  state: ExplorationState;
  dispatch: React.Dispatch<Action>;
  client: PrometheusClient;
  queryGen: MetricQueryGenerator;
  stepSec: number;
  executePromQL: (promql: string) => void;
  refreshCounter: number;
  onTimeRangeChange?: (from: string, to: string) => void;
}

export const ExplorationContext = createContext<ExplorationContextValue | null>(null);

export const useExploration = () => {
  const ctx = useContext(ExplorationContext);
  if (!ctx) throw new Error('useExploration must be used within ExplorationProvider');
  return ctx;
};
