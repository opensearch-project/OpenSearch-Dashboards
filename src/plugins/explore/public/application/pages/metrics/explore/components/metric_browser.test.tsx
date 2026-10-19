/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MetricBrowser } from './metric_browser';
import { ExplorationContext, defaultState } from '../contexts/exploration_context';
import { MetricQueryGenerator } from '../services/query_generator';

jest.mock('./sparkline', () => ({
  SparklineChart: () => <div data-test-subj="sparkline" />,
  SERIES_COLORS: ['#000'],
}));

// Every observed card reports itself visible right away.
class VisibleIntersectionObserver {
  constructor(private readonly callback: (entries: Array<{ isIntersecting: boolean }>) => void) {}
  observe() {
    this.callback([{ isIntersecting: true }]);
  }
  disconnect() {}
  unobserve() {}
}

const makeClient = () => ({
  dataConnectionId: 'fake-connection',
  getLabelNames: jest.fn().mockResolvedValue([]),
  getLabelValues: jest.fn().mockResolvedValue([]),
  getMetricNames: jest.fn().mockResolvedValue(['metric_one', 'metric_two']),
  getMetadata: jest.fn().mockResolvedValue({}),
  searchMetricNames: jest.fn().mockResolvedValue([]),
  queryRange: jest.fn().mockResolvedValue([{ values: [[1, '1']] }]),
});

const renderBrowser = (
  client: ReturnType<typeof makeClient>,
  gate: { previewsEnabled?: boolean; requestPreviews?: () => void }
) =>
  render(
    <ExplorationContext.Provider
      value={{
        state: defaultState,
        dispatch: jest.fn(),
        client: client as any,
        queryGen: new MetricQueryGenerator(),
        stepSec: 60,
        executePromQL: jest.fn(),
        refreshCounter: 0,
        ...gate,
      }}
    >
      <MetricBrowser />
    </ExplorationContext.Provider>
  );

describe('MetricBrowser previews', () => {
  const originalObserver = (global as any).IntersectionObserver;
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).IntersectionObserver = VisibleIntersectionObserver;
  });
  afterEach(() => {
    jest.useRealTimers();
    (global as any).IntersectionObserver = originalObserver;
  });

  const settle = async () => {
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  };

  it('loads previews for visible cards when the dataset type has no explicit-Run flag', async () => {
    const client = makeClient();
    renderBrowser(client, {});
    await settle();

    expect(client.queryRange).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId('metricsExplorePreviewsDeferred')).toBeNull();
  });

  it('sends no preview query while previews are deferred, and offers Load previews', async () => {
    const client = makeClient();
    const requestPreviews = jest.fn();
    renderBrowser(client, { previewsEnabled: false, requestPreviews });
    await settle();

    expect(client.queryRange).not.toHaveBeenCalled();
    expect(screen.getAllByTestId('metricsExploreCardPreviewDeferred')).toHaveLength(2);

    fireEvent.click(screen.getByTestId('metricsExploreLoadPreviewsButton'));
    expect(requestPreviews).toHaveBeenCalledTimes(1);
  });

  it('loads the visible previews once they are enabled', async () => {
    const client = makeClient();
    const { rerender } = renderBrowser(client, { previewsEnabled: false });
    await settle();
    expect(client.queryRange).not.toHaveBeenCalled();

    rerender(
      <ExplorationContext.Provider
        value={{
          state: defaultState,
          dispatch: jest.fn(),
          client: client as any,
          queryGen: new MetricQueryGenerator(),
          stepSec: 60,
          executePromQL: jest.fn(),
          refreshCounter: 0,
          previewsEnabled: true,
        }}
      >
        <MetricBrowser />
      </ExplorationContext.Provider>
    );
    await settle();

    expect(client.queryRange).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId('metricsExplorePreviewsDeferred')).toBeNull();
  });
});
