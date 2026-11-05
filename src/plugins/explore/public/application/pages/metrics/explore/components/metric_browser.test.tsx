/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MetricBrowser } from './metric_browser';
import {
  ExplorationContext,
  ExplorationSource,
  defaultState,
} from '../contexts/exploration_context';
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

describe('MetricBrowser error and empty states', () => {
  // What a failed HTTP call rejects with: the status text (empty over HTTP/2) as the message and
  // the server's error as the body.
  const httpError = (body: unknown) => Object.assign(new Error(''), { body });

  const renderWithSource = (client: ReturnType<typeof makeClient>, source?: ExplorationSource) =>
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
          source,
        }}
      >
        <MetricBrowser />
      </ExplorationContext.Provider>
    );

  it("shows the server's message and names the source when the metric list fails", async () => {
    const client = makeClient();
    client.getMetricNames.mockRejectedValue(
      httpError({ statusCode: 403, message: 'Unable to get resources: access denied' })
    );
    renderWithSource(client, { label: 'My Metrics' });

    expect(await screen.findByTestId('metricsExploreErrorMessage')).toHaveTextContent(
      'Unable to get resources: access denied'
    );
    const callout = screen.getByTestId('metricsExploreErrorCallout');
    expect(callout).toHaveTextContent(
      'We encountered a problem fetching data from the My Metrics data source.'
    );
    expect(callout).not.toHaveTextContent('Prometheus');
  });

  it('shows the error itself when the response has no message', async () => {
    const client = makeClient();
    client.getMetricNames.mockRejectedValue(new Error('Bad Gateway'));
    renderWithSource(client, { label: 'My Metrics' });

    expect(await screen.findByTestId('metricsExploreErrorMessage')).toHaveTextContent(
      'Bad Gateway'
    );
  });

  it('names the source and offers its samples when it lists no metrics', async () => {
    const client = makeClient();
    client.getMetricNames.mockResolvedValue([]);
    renderWithSource(client, {
      label: 'My Metrics',
      sampleQueries: [{ label: 'Up targets', query: 'up{job="mine"}' }],
    });

    expect(await screen.findByText('No metrics found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The selected My Metrics data source returned no metrics for the current time range. Try adjusting the time range.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/scraping targets/)).toBeNull();
    expect(screen.getByText('Up targets')).toBeInTheDocument();
    expect(screen.getByText('up{job="mine"}')).toBeInTheDocument();
    expect(screen.queryByText('HTTP request rate by status code')).toBeNull();
  });

  it("gives the source's own advice, and no samples section without samples", async () => {
    const client = makeClient();
    client.getMetricNames.mockResolvedValue([]);
    renderWithSource(client, {
      label: 'My Metrics',
      emptyHint: 'This source lists only some of its metrics here.',
      sampleQueries: [],
    });

    expect(
      await screen.findByText(
        'The selected My Metrics data source returned no metrics for the current time range. This source lists only some of its metrics here.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/Try adjusting the time range/)).toBeNull();
    expect(screen.queryByText('Sample PromQL queries')).toBeNull();
  });

  it('reads as before for the built-in Prometheus source', async () => {
    const client = makeClient();
    client.getMetricNames.mockResolvedValue([]);
    renderWithSource(client, {
      label: 'Prometheus',
      emptyHint: 'Try adjusting the time range or verify the data source is scraping targets.',
    });

    expect(
      await screen.findByText(
        'The selected Prometheus data source returned no metrics for the current time range. Try adjusting the time range or verify the data source is scraping targets.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('HTTP request rate by status code')).toBeInTheDocument();
  });

  it('names no source without one, and keeps the built-in samples', async () => {
    const client = makeClient();
    client.getMetricNames.mockResolvedValue([]);
    renderWithSource(client);

    expect(
      await screen.findByText(
        'The selected data source returned no metrics for the current time range. Try adjusting the time range.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('HTTP request rate by status code')).toBeInTheDocument();
  });
});
