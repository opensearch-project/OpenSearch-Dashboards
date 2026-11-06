/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SourceRowsView } from './source_rows_view';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_k: string, o: { defaultMessage: string; values?: Record<string, unknown> }) =>
      Object.entries(o.values ?? {}).reduce(
        (text, [key, value]) => text.replace(`{${key}}`, String(value)),
        o.defaultMessage
      ),
  },
}));
// The chart needs a real canvas; the card's own states are what these tests check.
jest.mock('./severity_histogram', () => ({
  SeverityHistogram: () => <div data-test-subj="mock-histogram" />,
}));

let mockRequiresExplicitRun = true;
let mockTypeRegistered = true;

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

/** jsdom has no IntersectionObserver: a fake that collects each card's callback. */
class FakeIntersectionObserver {
  static callbacks: Array<(entries: any[]) => void> = [];
  constructor(callback: (entries: any[]) => void) {
    FakeIntersectionObserver.callbacks.push(callback);
  }
  observe() {}
  disconnect() {}
}
const installIntersectionObserver = () => {
  FakeIntersectionObserver.callbacks = [];
  (global as any).IntersectionObserver = FakeIntersectionObserver;
  return FakeIntersectionObserver.callbacks;
};

const makeDrilldown = (overrides: Record<string, unknown> = {}) => ({
  ScopeSelector: () => null,
  listItems: jest.fn().mockResolvedValue({
    items: [
      { id: '/aws/lambda/a', name: '/aws/lambda/a', details: [{ label: 'Size', value: '1 MB' }] },
      { id: '/aws/ecs/b', name: '/aws/ecs/b' },
    ],
    nextToken: 'page-2',
  }),
  fetchPreview: jest.fn().mockResolvedValue({ rows: [{ '@timestamp': '2026-11-05', msg: 'hi' }] }),
  fetchHistogram: jest.fn().mockResolvedValue({
    series: [{ name: 'count', dataPoints: [[1000, 3]] }],
    intervalMs: 1000,
  }),
  toDataset: jest.fn().mockResolvedValue({ id: 'd', title: 'd', type: 'FAKE_LOGS' }),
  groupOf: (item: { name: string }) => item.name.split('/').slice(0, 3).join('/') + '/',
  ...overrides,
});

const makeServices = () =>
  ({
    data: {
      query: {
        queryString: {
          getDatasetService: () => ({
            cacheDataset: jest.fn().mockResolvedValue(undefined),
            getType: () =>
              mockTypeRegistered
                ? { meta: { requiresExplicitRun: mockRequiresExplicitRun } }
                : undefined,
          }),
          getInitialQueryByDataset: jest.fn((dataset) => ({ query: '', dataset })),
          setQuery: jest.fn(),
        },
        timefilter: {
          timefilter: {
            getBounds: () => ({ min: { valueOf: () => 0 }, max: { valueOf: () => 2000 } }),
          },
        },
      },
    },
    core: { application: { navigateToApp: jest.fn() } },
    notifications: { toasts: { addDanger: jest.fn() } },
    uiSettings: {},
    savedObjects: {},
    http: {},
  }) as unknown as any;

const renderView = (drilldown: any, props: Record<string, unknown> = {}) => {
  const services = makeServices();
  const onBatchActionChange = jest.fn();
  const utils = render(
    <SourceRowsView
      services={services}
      sourceType={{
        id: 'fake',
        label: 'Fake Logs',
        datasetTypes: ['FAKE_LOGS'],
        resolveDefaultDataset: jest.fn(),
        logsDrilldown: drilldown,
      }}
      scope={{ region: 'us-east-1' }}
      search=""
      refreshKey="a"
      onBrushTime={jest.fn()}
      onBatchActionChange={onBatchActionChange}
      {...props}
    />
  );
  return { ...utils, services, onBatchActionChange };
};

describe('SourceRowsView', () => {
  beforeEach(() => {
    mockRequiresExplicitRun = true;
    mockTypeRegistered = true;
  });

  it("lists the source's items and shows their free details without running anything", async () => {
    const drilldown = makeDrilldown();
    renderView(drilldown);
    expect(await screen.findByTestId('logsDrilldownSourceCard-/aws/lambda/a')).toBeInTheDocument();
    expect(drilldown.listItems).toHaveBeenCalledWith(
      expect.objectContaining({ scope: { region: 'us-east-1' }, search: '' })
    );
    expect(screen.getByTestId('logsDrilldownSourceCardDetails-/aws/lambda/a')).toHaveTextContent(
      'Size: 1 MB'
    );
    expect(screen.getByTestId('logsDrilldownSourceCardIdle-/aws/ecs/b')).toBeInTheDocument();
    await flush();
    expect(drilldown.fetchPreview).not.toHaveBeenCalled();
    expect(drilldown.fetchHistogram).not.toHaveBeenCalled();
  });

  it('runs only the card whose Run button is pressed, preview and histogram', async () => {
    const drilldown = makeDrilldown();
    renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-/aws/lambda/a'));
    expect(
      await screen.findByTestId('logsDrilldownSourceCardLogs-/aws/lambda/a')
    ).toHaveTextContent('hi');
    expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
    expect(drilldown.fetchPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({ id: '/aws/lambda/a' }),
        from: 0,
        to: 2000,
        size: 10,
      })
    );
    expect(drilldown.fetchHistogram).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-histogram')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceCardIdle-/aws/ecs/b')).toBeInTheDocument();
  });

  it('marks a run card stale on a time range change instead of running it again', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-/aws/lambda/a'));
    await screen.findByTestId('logsDrilldownSourceCardLogs-/aws/lambda/a');

    rerender(
      <SourceRowsView
        services={services}
        sourceType={{
          id: 'fake',
          label: 'Fake Logs',
          datasetTypes: ['FAKE_LOGS'],
          resolveDefaultDataset: jest.fn(),
          logsDrilldown: drilldown,
        }}
        scope={{ region: 'us-east-1' }}
        search=""
        refreshKey="b"
        onBrushTime={jest.fn()}
        onBatchActionChange={onBatchActionChange}
      />
    );
    await flush();
    expect(screen.getByTestId('logsDrilldownSourceCardStale-/aws/lambda/a')).toBeInTheDocument();
    expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('logsDrilldownSourceCardRun-/aws/lambda/a')).toHaveTextContent(
      'Run again'
    );
  });

  it('shows a failed preview on the card', async () => {
    const drilldown = makeDrilldown({
      fetchPreview: jest.fn().mockRejectedValue(new Error('AccessDenied')),
    });
    renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-/aws/ecs/b'));
    expect(await screen.findByTestId('logsDrilldownSourceCardError-/aws/ecs/b')).toHaveTextContent(
      'AccessDenied'
    );
  });

  it('keeps the events when only the histogram fails', async () => {
    const drilldown = makeDrilldown({
      fetchHistogram: jest.fn().mockRejectedValue(new Error('too big')),
    });
    renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-/aws/ecs/b'));
    expect(await screen.findByText('Histogram unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceCardLogs-/aws/ecs/b')).toHaveTextContent('hi');
  });

  it('groups items by the source prefix', async () => {
    renderView(makeDrilldown());
    await screen.findByTestId('logsDrilldownSourceRows');
    // The button group's radios share one generated id in tests, so click the radio itself.
    fireEvent.click(screen.getByTestId('prefix'));
    expect(screen.getByText('/aws/ecs/ (1)')).toBeInTheDocument();
    expect(screen.getByText('/aws/lambda/ (1)')).toBeInTheDocument();
  });

  it('loads the next page with the token the source returned', async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems
      .mockResolvedValueOnce({ items: [{ id: 'a', name: 'a' }], nextToken: 't2' })
      .mockResolvedValueOnce({ items: [{ id: 'b', name: 'b' }] });
    renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceLoadMore'));
    expect(await screen.findByTestId('logsDrilldownSourceCard-b')).toBeInTheDocument();
    expect(drilldown.listItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ nextToken: 't2' })
    );
    expect(screen.queryByTestId('logsDrilldownSourceLoadMore')).not.toBeInTheDocument();
  });

  it('opens the selected items as one dataset in Logs', async () => {
    const drilldown = makeDrilldown();
    const { services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-/aws/lambda/a'));
    fireEvent.click(screen.getByTestId('logsDrilldownSourceCardCheckbox-/aws/ecs/b'));

    const action = onBatchActionChange.mock.calls[onBatchActionChange.mock.calls.length - 1][0];
    expect(action.label).toContain('in Logs');
    await act(async () => action.onClick());

    expect(drilldown.toDataset).toHaveBeenCalledWith({
      scope: { region: 'us-east-1' },
      items: [
        expect.objectContaining({ id: '/aws/lambda/a' }),
        expect.objectContaining({ id: '/aws/ecs/b' }),
      ],
    });
    expect(services.data.query.queryString.setQuery).toHaveBeenCalledWith(
      expect.objectContaining({ dataset: expect.objectContaining({ type: 'FAKE_LOGS' }) })
    );
    const [appId, { path }] = services.core.application.navigateToApp.mock.calls[0];
    expect(appId).toBe('explore/logs');
    // The dataset is named in the URL, which the Logs page reads before the shared query state.
    expect(path).toMatch(/^#\/\?_q=/);
    expect(decodeURIComponent(path)).toContain('type:FAKE_LOGS');
    expect(drilldown.fetchPreview).not.toHaveBeenCalled();
  });

  it('shows a listing failure with a Retry', async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems
      .mockRejectedValueOnce(new Error('throttled'))
      .mockResolvedValueOnce({ items: [{ id: 'a', name: 'a' }] });
    renderView(drilldown);
    expect(await screen.findByTestId('logsDrilldownSourceListError')).toHaveTextContent(
      'throttled'
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByTestId('logsDrilldownSourceCard-a')).toBeInTheDocument();
  });

  it("shows the source's empty state, with the page's own as children, when nothing is listed", async () => {
    const EmptyState = jest.fn(({ children, search }: any) => (
      <div data-test-subj="sourceEmpty" data-search={search}>
        {children}
      </div>
    ));
    const drilldown = makeDrilldown({ EmptyState });
    drilldown.listItems.mockResolvedValue({ items: [] });
    renderView(drilldown);
    expect(await screen.findByTestId('sourceEmpty')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceEmpty')).toBeInTheDocument();
    expect(EmptyState.mock.calls[0][0]).toMatchObject({
      scope: { region: 'us-east-1' },
      search: '',
      error: undefined,
    });
  });

  it('passes the listing rejection as is to the empty state, and lists again on its refresh', async () => {
    const rejection = Object.assign(new Error('Forbidden'), { body: { statusCode: 403 } });
    let lastProps: any;
    const EmptyState = (props: any) => {
      lastProps = props;
      return <button onClick={props.onRefresh}>custom refresh</button>;
    };
    const drilldown = makeDrilldown({ EmptyState });
    drilldown.listItems
      .mockRejectedValueOnce(rejection)
      .mockResolvedValueOnce({ items: [{ id: 'a', name: 'a' }] });
    renderView(drilldown);
    const refresh = await screen.findByText('custom refresh');
    expect(lastProps.error).toBe(rejection);
    fireEvent.click(refresh);
    expect(await screen.findByTestId('logsDrilldownSourceCard-a')).toBeInTheDocument();
    expect(drilldown.listItems).toHaveBeenCalledTimes(2);
  });

  it('waits for Run when the dataset type is not registered (fails closed)', async () => {
    mockRequiresExplicitRun = false;
    mockTypeRegistered = false;
    const drilldown = makeDrilldown();
    renderView(drilldown);
    expect(await screen.findByTestId('logsDrilldownSourceCardRun-/aws/ecs/b')).toBeInTheDocument();
    await flush();
    expect(drilldown.fetchPreview).not.toHaveBeenCalled();
  });

  it('keeps a run card through a search that hides it and shows it again', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-/aws/ecs/b'));
    await screen.findByTestId('logsDrilldownSourceCardLogs-/aws/ecs/b');
    const view = (search: string) => (
      <SourceRowsView
        services={services}
        sourceType={{
          id: 'fake',
          label: 'Fake Logs',
          datasetTypes: ['FAKE_LOGS'],
          resolveDefaultDataset: jest.fn(),
          logsDrilldown: drilldown,
        }}
        scope={{ region: 'us-east-1' }}
        search={search}
        refreshKey="a"
        onBrushTime={jest.fn()}
        onBatchActionChange={onBatchActionChange}
      />
    );
    drilldown.listItems.mockResolvedValueOnce({
      items: [{ id: '/aws/lambda/a', name: '/aws/lambda/a' }],
    });
    rerender(view('lambda'));
    await screen.findByTestId('logsDrilldownSourceCard-/aws/lambda/a');
    rerender(view(''));
    expect(await screen.findByTestId('logsDrilldownSourceCardLogs-/aws/ecs/b')).toHaveTextContent(
      'hi'
    );
    expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
  });

  it('still opens a ticked item that a search hides', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-/aws/ecs/b'));
    drilldown.listItems.mockResolvedValueOnce({
      items: [{ id: '/aws/lambda/a', name: '/aws/lambda/a' }],
    });
    rerender(
      <SourceRowsView
        services={services}
        sourceType={{
          id: 'fake',
          label: 'Fake Logs',
          datasetTypes: ['FAKE_LOGS'],
          resolveDefaultDataset: jest.fn(),
          logsDrilldown: drilldown,
        }}
        scope={{ region: 'us-east-1' }}
        search="lambda"
        refreshKey="a"
        onBrushTime={jest.fn()}
        onBatchActionChange={onBatchActionChange}
      />
    );
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-/aws/lambda/a'));
    const action = onBatchActionChange.mock.calls[onBatchActionChange.mock.calls.length - 1][0];
    await act(async () => action.onClick());
    expect(drilldown.toDataset).toHaveBeenCalledWith({
      scope: { region: 'us-east-1' },
      items: [
        expect.objectContaining({ id: '/aws/ecs/b' }),
        expect.objectContaining({ id: '/aws/lambda/a' }),
      ],
    });
  });

  const viewWith = (drilldown: any, services: any, onBatchActionChange: any, props: any) => (
    <SourceRowsView
      services={services}
      sourceType={{
        id: 'fake',
        label: 'Fake Logs',
        datasetTypes: ['FAKE_LOGS'],
        resolveDefaultDataset: jest.fn(),
        logsDrilldown: drilldown,
      }}
      scope={{ region: 'us-east-1' }}
      search=""
      refreshKey="a"
      onBrushTime={jest.fn()}
      onBatchActionChange={onBatchActionChange}
      {...props}
    />
  );

  it('does not list again on a time range change, so loaded pages stay', async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems
      .mockResolvedValueOnce({ items: [{ id: 'a', name: 'a' }], nextToken: 't2' })
      .mockResolvedValueOnce({ items: [{ id: 'b', name: 'b' }] });
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceLoadMore'));
    await screen.findByTestId('logsDrilldownSourceCard-b');
    rerender(viewWith(drilldown, services, onBatchActionChange, { refreshKey: 'later' }));
    await flush();
    expect(drilldown.listItems).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('logsDrilldownSourceCard-b')).toBeInTheDocument();
  });

  it("lists again on the page's Refresh, keeping the cards meanwhile", async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    await screen.findByTestId('logsDrilldownSourceCard-/aws/ecs/b');
    let resolveList: (page: unknown) => void = () => {};
    drilldown.listItems.mockReturnValueOnce(new Promise((resolve) => (resolveList = resolve)));
    rerender(viewWith(drilldown, services, onBatchActionChange, { listRefreshKey: 1 }));
    expect(drilldown.listItems).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('logsDrilldownSourceCard-/aws/ecs/b')).toBeInTheDocument();
    await act(async () => resolveList({ items: [{ id: 'new', name: 'new' }] }));
    expect(await screen.findByTestId('logsDrilldownSourceCard-new')).toBeInTheDocument();
  });

  it('keeps the list when a refresh fails, and Retry lists again', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    await screen.findByTestId('logsDrilldownSourceCard-/aws/ecs/b');
    drilldown.listItems
      .mockRejectedValueOnce(new Error('throttled'))
      .mockResolvedValueOnce({ items: [{ id: 'again', name: 'again' }] });
    rerender(viewWith(drilldown, services, onBatchActionChange, { listRefreshKey: 1 }));
    expect(await screen.findByText('throttled')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceCard-/aws/ecs/b')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(await screen.findByTestId('logsDrilldownSourceCard-again')).toBeInTheDocument();
  });

  it('never runs a card on scroll, search or time change when the source requires an explicit run', async () => {
    const observers = installIntersectionObserver();
    jest.useFakeTimers();
    try {
      const drilldown = makeDrilldown();
      const { rerender, services, onBatchActionChange } = renderView(drilldown);
      await act(async () => {
        await Promise.resolve();
      });
      expect(observers.length).toBeGreaterThan(0);
      act(() => observers.forEach((callback) => callback([{ isIntersecting: true }])));
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      rerender(
        viewWith(drilldown, services, onBatchActionChange, { refreshKey: 'b', search: 'aws' })
      );
      act(() => observers.forEach((callback) => callback([{ isIntersecting: true }])));
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(drilldown.fetchPreview).not.toHaveBeenCalled();
      expect(drilldown.fetchHistogram).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
      delete (global as any).IntersectionObserver;
    }
  });

  it("stops ticks at the source's maxSelection", async () => {
    renderView(makeDrilldown({ maxSelection: 1 }));
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-/aws/ecs/b'));
    expect(screen.getByTestId('logsDrilldownSourceCardCheckbox-/aws/lambda/a')).toBeDisabled();
    fireEvent.click(screen.getByTestId('logsDrilldownSourceCardCheckbox-/aws/ecs/b'));
    expect(screen.getByTestId('logsDrilldownSourceCardCheckbox-/aws/lambda/a')).not.toBeDisabled();
  });

  it("names the item in each Run button's accessible label", async () => {
    renderView(makeDrilldown());
    expect(await screen.findByTestId('logsDrilldownSourceCardRun-/aws/ecs/b')).toHaveAttribute(
      'aria-label',
      'Run /aws/ecs/b'
    );
  });

  it('runs cards as they scroll into view on a source that does not require an explicit run', async () => {
    mockRequiresExplicitRun = false;
    const observers = installIntersectionObserver();
    jest.useFakeTimers();
    try {
      const drilldown = makeDrilldown();
      renderView(drilldown);
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId('logsDrilldownSourceCardRun-/aws/ecs/b')).not.toBeInTheDocument();
      act(() => observers.forEach((callback) => callback([{ isIntersecting: true }])));
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      expect(drilldown.fetchPreview).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
      delete (global as any).IntersectionObserver;
    }
  });
});
