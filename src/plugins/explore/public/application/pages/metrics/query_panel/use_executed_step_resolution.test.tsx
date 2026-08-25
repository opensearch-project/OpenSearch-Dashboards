/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useExecutedStepResolution } from './use_executed_step_resolution';
import { resultsCache } from '../../../utils/state_management/slices';

const stepResolution = {
  maxDataPoints: 1440,
  queries: [
    { label: 'A', stepSec: 300, rateIntervalSec: 1200 },
    { label: 'B', stepSec: 15, rateIntervalSec: 240 },
  ],
};

describe('useExecutedStepResolution', () => {
  const render = (state: any) => {
    const store = configureStore({ reducer: () => state });
    return renderHook(() => useExecutedStepResolution(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  beforeEach(() => {
    resultsCache.clear();
  });

  it('maps the reported steps by query label', () => {
    resultsCache.set('metric_a;\nmetric_b;', { stepResolution } as any);
    const { result } = render({
      query: { query: 'metric_a;\nmetric_b;', language: 'PROMQL' },
      results: { 'metric_a;\nmetric_b;': { total: 2 } },
    });

    expect(result.current).toEqual({
      query: 'metric_a;\nmetric_b;',
      maxDataPoints: 1440,
      byLabel: {
        A: { stepSec: 300, rateIntervalSec: 1200 },
        B: { stepSec: 15, rateIntervalSec: 240 },
      },
    });
  });

  it('returns undefined until the query has results', () => {
    resultsCache.set('up', { stepResolution } as any);
    const { result } = render({ query: { query: 'up', language: 'PROMQL' }, results: {} });
    expect(result.current).toBeUndefined();
  });

  it('returns undefined for a response without step metadata', () => {
    resultsCache.set('up', {} as any);
    const { result } = render({
      query: { query: 'up', language: 'PROMQL' },
      results: { up: { total: 1 } },
    });
    expect(result.current).toBeUndefined();
  });

  it('ignores results from other query languages', () => {
    resultsCache.set('source=logs', { stepResolution } as any);
    const { result } = render({
      query: { query: 'source=logs', language: 'PPL' },
      results: { 'source=logs': { total: 1 } },
    });
    expect(result.current).toBeUndefined();
  });

  it('picks up a new step after the same query re-runs', () => {
    resultsCache.set('up', { stepResolution } as any);
    const state = {
      query: { query: 'up', language: 'PROMQL' },
      results: { up: { total: 1 } },
    };
    const store = configureStore({ reducer: () => state });
    const { result, rerender } = renderHook(() => useExecutedStepResolution(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(result.current?.byLabel.A.stepSec).toBe(300);

    resultsCache.set('up', {
      stepResolution: {
        maxDataPoints: 20,
        queries: [{ label: 'A', stepSec: 200, rateIntervalSec: 260 }],
      },
    } as any);
    // Redux replaces the metadata object on every execution.
    state.results = { up: { total: 1 } };
    rerender();

    expect(result.current?.byLabel.A.stepSec).toBe(200);
  });
});
