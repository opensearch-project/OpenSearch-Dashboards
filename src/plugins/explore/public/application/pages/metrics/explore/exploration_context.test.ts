/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { explorationReducer, defaultState } from './exploration_context';
import { ExplorationLevel, GroupingStrategy, LayoutMode } from './types';

describe('explorationReducer', () => {
  it('SET_SEARCH updates search', () => {
    const result = explorationReducer(defaultState, { type: 'SET_SEARCH', search: 'cpu' });
    expect(result.search).toBe('cpu');
  });

  it('SELECT_METRIC transitions to DETAIL and clears label', () => {
    const state = { ...defaultState, label: 'old' };
    const result = explorationReducer(state, { type: 'SELECT_METRIC', metric: 'up' });
    expect(result.level).toBe(ExplorationLevel.DETAIL);
    expect(result.metric).toBe('up');
    expect(result.label).toBe('');
  });

  it('SELECT_LABEL transitions to BREAKDOWN', () => {
    const state = { ...defaultState, level: ExplorationLevel.DETAIL, metric: 'up' };
    const result = explorationReducer(state, { type: 'SELECT_LABEL', label: 'job' });
    expect(result.level).toBe(ExplorationLevel.BREAKDOWN);
    expect(result.label).toBe('job');
  });

  it('ADD_FILTER appends a filter', () => {
    const filter = { name: 'job', operator: '=' as const, value: 'api' };
    const result = explorationReducer(defaultState, { type: 'ADD_FILTER', filter });
    expect(result.filters).toHaveLength(1);
    expect(result.filters[0]).toEqual(filter);
  });

  it('REMOVE_FILTER removes by index', () => {
    const state = {
      ...defaultState,
      filters: [
        { name: 'a', operator: '=' as const, value: '1' },
        { name: 'b', operator: '=' as const, value: '2' },
      ],
    };
    const result = explorationReducer(state, { type: 'REMOVE_FILTER', index: 0 });
    expect(result.filters).toHaveLength(1);
    expect(result.filters[0].name).toBe('b');
  });

  it('TOGGLE_FILTER toggles enabled state', () => {
    const state = {
      ...defaultState,
      filters: [{ name: 'a', operator: '=' as const, value: '1', enabled: true }],
    };
    const result = explorationReducer(state, { type: 'TOGGLE_FILTER', index: 0 });
    expect(result.filters[0].enabled).toBe(false);
  });

  it('CLEAR_FILTERS empties filters', () => {
    const state = {
      ...defaultState,
      filters: [{ name: 'a', operator: '=' as const, value: '1' }],
    };
    const result = explorationReducer(state, { type: 'CLEAR_FILTERS' });
    expect(result.filters).toEqual([]);
  });

  it('SET_GROUPING updates grouping', () => {
    const result = explorationReducer(defaultState, {
      type: 'SET_GROUPING',
      grouping: GroupingStrategy.PREFIX,
    });
    expect(result.grouping).toBe(GroupingStrategy.PREFIX);
  });

  it('SET_LAYOUT updates layout', () => {
    const result = explorationReducer(defaultState, {
      type: 'SET_LAYOUT',
      layout: LayoutMode.ROWS,
    });
    expect(result.layout).toBe(LayoutMode.ROWS);
  });

  describe('GO_BACK', () => {
    it('goes from BREAKDOWN to DETAIL', () => {
      const state = {
        ...defaultState,
        level: ExplorationLevel.BREAKDOWN,
        metric: 'up',
        label: 'job',
      };
      const result = explorationReducer(state, { type: 'GO_BACK' });
      expect(result.level).toBe(ExplorationLevel.DETAIL);
      expect(result.label).toBe('');
    });

    it('goes from DETAIL to BROWSER', () => {
      const state = { ...defaultState, level: ExplorationLevel.DETAIL, metric: 'up' };
      const result = explorationReducer(state, { type: 'GO_BACK' });
      expect(result.level).toBe(ExplorationLevel.BROWSER);
      expect(result.metric).toBe('');
    });

    it('stays at BROWSER', () => {
      const result = explorationReducer(defaultState, { type: 'GO_BACK' });
      expect(result.level).toBe(ExplorationLevel.BROWSER);
    });
  });

  it('RESTORE merges partial state', () => {
    const result = explorationReducer(defaultState, {
      type: 'RESTORE',
      state: { metric: 'up', level: ExplorationLevel.DETAIL },
    });
    expect(result.metric).toBe('up');
    expect(result.level).toBe(ExplorationLevel.DETAIL);
    expect(result.search).toBe(''); // unchanged
  });

  it('returns state for unknown action', () => {
    const result = explorationReducer(defaultState, { type: 'UNKNOWN' } as any);
    expect(result).toBe(defaultState);
  });
});
