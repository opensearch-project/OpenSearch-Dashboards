/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MetricDetail } from './metric_detail';
import { ExplorationContext, defaultState } from '../contexts/exploration_context';
import { MetricQueryGenerator } from '../services/query_generator';
import { ExplorationLevel } from '../types';

jest.mock('./sparkline', () => ({
  SparklineChart: () => <div data-test-subj="sparkline" />,
  SERIES_COLORS: ['#000'],
}));
jest.mock('./label_filter_bar', () => ({
  LabelFilterBar: () => null,
  LabelFilterBadges: () => null,
}));

// Every observed breakdown panel reports itself visible right away.
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
  getMetadata: jest.fn().mockResolvedValue({}),
  getLabelsForMetric: jest.fn().mockResolvedValue(['job']),
  queryRange: jest.fn().mockResolvedValue([{ metric: { job: 'a' }, values: [[1, '1']] }]),
});

const renderDetail = (
  client: ReturnType<typeof makeClient>,
  gate: { previewsEnabled?: boolean; requestPreviews?: () => void }
) =>
  render(
    <ExplorationContext.Provider
      value={{
        state: { ...defaultState, level: ExplorationLevel.DETAIL, metric: 'metric_one' },
        dispatch: jest.fn(),
        client: client as any,
        queryGen: new MetricQueryGenerator(),
        stepSec: 60,
        executePromQL: jest.fn(),
        refreshCounter: 0,
        ...gate,
      }}
    >
      <MetricDetail />
    </ExplorationContext.Provider>
  );

describe('MetricDetail explicit-Run gate', () => {
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
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  };

  it('loads the chart and the breakdowns when the dataset type has no explicit-Run flag', async () => {
    const client = makeClient();
    renderDetail(client, {});
    await settle();

    expect(client.queryRange).toHaveBeenCalled();
    expect(screen.queryByTestId('metricsExploreDetailDeferred')).toBeNull();
    expect(screen.queryByTestId('metricsExploreDetailChartDeferred')).toBeNull();
    expect(screen.queryByTestId('metricsExploreBreakdownDeferred')).toBeNull();
  });

  it('sends no range or breakdown query while deferred, shows a not-loaded state and offers Load charts', async () => {
    const client = makeClient();
    const requestPreviews = jest.fn();
    renderDetail(client, { previewsEnabled: false, requestPreviews });
    await settle();

    expect(client.getMetadata).toHaveBeenCalled();
    expect(client.getLabelsForMetric).toHaveBeenCalled();
    expect(client.queryRange).not.toHaveBeenCalled();
    expect(screen.getByTestId('metricsExploreDetailDeferred')).toBeInTheDocument();
    expect(screen.getByTestId('metricsExploreDetailChartDeferred')).toBeInTheDocument();
    expect(screen.getByTestId('metricsExploreBreakdownDeferred')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('metricsExploreDetailLoadButton'));
    expect(requestPreviews).toHaveBeenCalledTimes(1);
  });
});
