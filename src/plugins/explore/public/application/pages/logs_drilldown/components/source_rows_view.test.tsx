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

/*
 * The page runs a card's queries through the data plugin's search service. The fake search source
 * below answers by query text, through these runners, so a test can count and fail each kind:
 * `fetchPreview` for the preview query, `fetchHistogram` for the histogram query (rows either way).
 */
let mockRunners: { fetchPreview: jest.Mock; fetchHistogram: jest.Mock } = {
  fetchPreview: jest.fn(),
  fetchHistogram: jest.fn(),
};

const makeDrilldown = (overrides: Record<string, any> = {}) => {
  const drilldown = {
    ScopeSelector: () => null,
    listItems: jest.fn().mockResolvedValue({
      items: [
        { id: 'app/web/a', name: 'app/web/a', details: [{ label: 'Size', value: '1 MB' }] },
        { id: 'app/api/b', name: 'app/api/b' },
      ],
      nextToken: 'page-2',
    }),
    fetchPreview: jest
      .fn()
      .mockResolvedValue({ rows: [{ '@timestamp': '2026-11-05', msg: 'hi' }] }),
    fetchHistogram: jest.fn().mockResolvedValue({ rows: [{ '@timestamp': 1000, count: 3 }] }),
    buildPreviewQuery: jest.fn(() => 'PREVIEW'),
    buildHistogramQuery: jest.fn(() => 'HISTOGRAM'),
    toDataset: jest.fn().mockResolvedValue({
      id: 'd',
      title: 'd',
      type: 'FAKE_LOGS',
      language: 'FAKE_QL',
      timeFieldName: '@timestamp',
    }),
    groupOf: (item: { name: string }) => item.name.split('/').slice(0, 2).join('/') + '/',
    ...overrides,
  };
  mockRunners = { fetchPreview: drilldown.fetchPreview, fetchHistogram: drilldown.fetchHistogram };
  return drilldown;
};

const makeSearchSource = () => {
  let fields: any = {};
  return {
    setFields: (next: any) => {
      fields = next;
    },
    fetch: async ({ abortSignal }: { abortSignal: AbortSignal }) => {
      const runner =
        fields.query.query === 'PREVIEW' ? mockRunners.fetchPreview : mockRunners.fetchHistogram;
      const { rows } = await runner({
        query: fields.query,
        size: fields.size,
        signal: abortSignal,
      });
      return { hits: { hits: rows.map((row: unknown) => ({ _source: row })) } };
    },
  };
};

const makeServices = () =>
  ({
    data: {
      dataViews: { get: jest.fn().mockResolvedValue({ id: 'd' }) },
      search: { searchSource: { create: jest.fn(async () => makeSearchSource()) } },
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
    notifications: { toasts: { addDanger: jest.fn(), addWarning: jest.fn() } },
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
      scope={{ zone: 'zone-a' }}
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
    expect(await screen.findByTestId('logsDrilldownSourceCard-app/web/a')).toBeInTheDocument();
    expect(drilldown.listItems).toHaveBeenCalledWith(
      expect.objectContaining({ scope: { zone: 'zone-a' }, search: '' })
    );
    expect(screen.getByTestId('logsDrilldownSourceCardDetails-app/web/a')).toHaveTextContent(
      'Size: 1 MB'
    );
    expect(screen.getByTestId('logsDrilldownSourceCardIdle-app/api/b')).toBeInTheDocument();
    await flush();
    expect(drilldown.fetchPreview).not.toHaveBeenCalled();
    expect(drilldown.fetchHistogram).not.toHaveBeenCalled();
  });

  it('runs only the card whose Run button is pressed, preview and histogram', async () => {
    const drilldown = makeDrilldown();
    renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-app/web/a'));
    expect(await screen.findByTestId('logsDrilldownSourceCardLogs-app/web/a')).toHaveTextContent(
      'hi'
    );
    expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
    // The source builds the query for the item's own dataset; the page runs it through search.
    expect(drilldown.buildPreviewQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({ id: 'app/web/a' }),
        dataset: expect.objectContaining({ type: 'FAKE_LOGS' }),
        size: 10,
      })
    );
    expect(drilldown.toDataset).toHaveBeenCalledWith({
      scope: { zone: 'zone-a' },
      items: [expect.objectContaining({ id: 'app/web/a' })],
    });
    expect(drilldown.fetchPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ query: 'PREVIEW', language: 'FAKE_QL' }),
        size: 10,
      })
    );
    expect(drilldown.fetchHistogram).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-histogram')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceCardIdle-app/api/b')).toBeInTheDocument();
  });

  it('marks a run card stale on a time range change instead of running it again', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-app/web/a'));
    await screen.findByTestId('logsDrilldownSourceCardLogs-app/web/a');

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
        scope={{ zone: 'zone-a' }}
        search=""
        refreshKey="b"
        onBrushTime={jest.fn()}
        onBatchActionChange={onBatchActionChange}
      />
    );
    await flush();
    expect(screen.getByTestId('logsDrilldownSourceCardStale-app/web/a')).toBeInTheDocument();
    expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('logsDrilldownSourceCardRun-app/web/a')).toHaveTextContent(
      'Run again'
    );
  });

  it('shows a failed preview on the card', async () => {
    const drilldown = makeDrilldown({
      fetchPreview: jest.fn().mockRejectedValue(new Error('AccessDenied')),
    });
    renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-app/api/b'));
    expect(await screen.findByTestId('logsDrilldownSourceCardError-app/api/b')).toHaveTextContent(
      'AccessDenied'
    );
  });

  it('keeps the events when only the histogram fails', async () => {
    const drilldown = makeDrilldown({
      fetchHistogram: jest.fn().mockRejectedValue(new Error('too big')),
    });
    renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-app/api/b'));
    expect(await screen.findByText('Histogram unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceCardLogs-app/api/b')).toHaveTextContent('hi');
  });

  it('groups items by the source prefix', async () => {
    renderView(makeDrilldown());
    await screen.findByTestId('logsDrilldownSourceRows');
    // The button group's radios share one generated id in tests, so click the radio itself.
    fireEvent.click(screen.getByTestId('prefix'));
    expect(screen.getByText('app/api/ (1)')).toBeInTheDocument();
    expect(screen.getByText('app/web/ (1)')).toBeInTheDocument();
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
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-app/web/a'));
    fireEvent.click(screen.getByTestId('logsDrilldownSourceCardCheckbox-app/api/b'));

    const action = onBatchActionChange.mock.calls[onBatchActionChange.mock.calls.length - 1][0];
    expect(action.label).toContain('in Logs');
    await act(async () => action.onClick());

    expect(drilldown.toDataset).toHaveBeenCalledWith({
      scope: { zone: 'zone-a' },
      items: [
        expect.objectContaining({ id: 'app/web/a' }),
        expect.objectContaining({ id: 'app/api/b' }),
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

  const tickAndOpen = async (drilldown: any) => {
    const view = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-app/api/b'));
    const action =
      view.onBatchActionChange.mock.calls[view.onBatchActionChange.mock.calls.length - 1][0];
    return { ...view, action };
  };

  it("refuses a dataset of another source's type, with a toast", async () => {
    const drilldown = makeDrilldown({
      toDataset: jest.fn().mockResolvedValue({ id: 'x', title: 'x', type: 'OTHER' }),
    });
    const { services, action } = await tickAndOpen(drilldown);
    await act(async () => action.onClick());
    expect(services.notifications.toasts.addDanger).toHaveBeenCalled();
    expect(services.core.application.navigateToApp).not.toHaveBeenCalled();
  });

  it('opens once for a double click', async () => {
    let answer: (value: unknown) => void = () => {};
    const drilldown = makeDrilldown({
      toDataset: jest.fn(() => new Promise((resolve) => (answer = resolve))),
    });
    const { services, action } = await tickAndOpen(drilldown);
    act(() => {
      action.onClick();
      action.onClick();
    });
    await act(async () => answer({ id: 'd', title: 'd', type: 'FAKE_LOGS', language: 'FAKE_QL' }));
    expect(drilldown.toDataset).toHaveBeenCalledTimes(1);
    expect(services.core.application.navigateToApp).toHaveBeenCalledTimes(1);
  });

  it("warns when the selection's fields can't be loaded, and still opens it", async () => {
    const drilldown = makeDrilldown();
    const { services, action } = await tickAndOpen(drilldown);
    services.data.query.queryString.getDatasetService = () => ({
      cacheDataset: jest.fn().mockRejectedValue(new Error('no fields')),
      getType: () => ({ meta: { requiresExplicitRun: true } }),
    });
    await act(async () => action.onClick());
    expect(services.notifications.toasts.addWarning).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'no fields' })
    );
    expect(services.core.application.navigateToApp).toHaveBeenCalled();
  });

  it("keeps an item whose group can't be computed, in no group", async () => {
    const drilldown = makeDrilldown({
      groupOf: (item: { name: string }) => {
        if (item.name.includes('api')) throw new Error('bad');
        return 'app/web/';
      },
    });
    renderView(drilldown);
    await screen.findByTestId('logsDrilldownSourceRows');
    fireEvent.click(screen.getByTestId('prefix'));
    expect(screen.getByTestId('logsDrilldownSourceCard-app/api/b')).toBeInTheDocument();
    expect(screen.getByText('app/web/ (1)')).toBeInTheDocument();
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
      scope: { zone: 'zone-a' },
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
    expect(await screen.findByTestId('logsDrilldownSourceCardRun-app/api/b')).toBeInTheDocument();
    await flush();
    expect(drilldown.fetchPreview).not.toHaveBeenCalled();
  });

  it('keeps a run card through a search that hides it and shows it again', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardRun-app/api/b'));
    await screen.findByTestId('logsDrilldownSourceCardLogs-app/api/b');
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
        scope={{ zone: 'zone-a' }}
        search={search}
        refreshKey="a"
        onBrushTime={jest.fn()}
        onBatchActionChange={onBatchActionChange}
      />
    );
    drilldown.listItems.mockResolvedValueOnce({
      items: [{ id: 'app/web/a', name: 'app/web/a' }],
    });
    rerender(view('web'));
    await screen.findByTestId('logsDrilldownSourceCard-app/web/a');
    rerender(view(''));
    expect(await screen.findByTestId('logsDrilldownSourceCardLogs-app/api/b')).toHaveTextContent(
      'hi'
    );
    expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
  });

  it('still opens a ticked item that a search hides', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-app/api/b'));
    drilldown.listItems.mockResolvedValueOnce({
      items: [{ id: 'app/web/a', name: 'app/web/a' }],
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
        scope={{ zone: 'zone-a' }}
        search="web"
        refreshKey="a"
        onBrushTime={jest.fn()}
        onBatchActionChange={onBatchActionChange}
      />
    );
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-app/web/a'));
    const action = onBatchActionChange.mock.calls[onBatchActionChange.mock.calls.length - 1][0];
    await act(async () => action.onClick());
    expect(drilldown.toDataset).toHaveBeenCalledWith({
      scope: { zone: 'zone-a' },
      items: [
        expect.objectContaining({ id: 'app/api/b' }),
        expect.objectContaining({ id: 'app/web/a' }),
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
      scope={{ zone: 'zone-a' }}
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
    await screen.findByTestId('logsDrilldownSourceCard-app/api/b');
    let resolveList: (page: unknown) => void = () => {};
    drilldown.listItems.mockReturnValueOnce(new Promise((resolve) => (resolveList = resolve)));
    rerender(viewWith(drilldown, services, onBatchActionChange, { listRefreshKey: 1 }));
    await flush();
    expect(drilldown.listItems).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('logsDrilldownSourceCard-app/api/b')).toBeInTheDocument();
    await act(async () => resolveList({ items: [{ id: 'new', name: 'new' }] }));
    expect(await screen.findByTestId('logsDrilldownSourceCard-new')).toBeInTheDocument();
  });

  it('keeps the list when a refresh fails, and Retry lists again', async () => {
    const drilldown = makeDrilldown();
    const { rerender, services, onBatchActionChange } = renderView(drilldown);
    await screen.findByTestId('logsDrilldownSourceCard-app/api/b');
    drilldown.listItems
      .mockRejectedValueOnce(new Error('throttled'))
      .mockResolvedValueOnce({ items: [{ id: 'again', name: 'again' }] });
    rerender(viewWith(drilldown, services, onBatchActionChange, { listRefreshKey: 1 }));
    expect(await screen.findByText('throttled')).toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSourceCard-app/api/b')).toBeInTheDocument();
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
        viewWith(drilldown, services, onBatchActionChange, { refreshKey: 'b', search: 'app' })
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
    fireEvent.click(await screen.findByTestId('logsDrilldownSourceCardCheckbox-app/api/b'));
    expect(screen.getByTestId('logsDrilldownSourceCardCheckbox-app/web/a')).toBeDisabled();
    fireEvent.click(screen.getByTestId('logsDrilldownSourceCardCheckbox-app/api/b'));
    expect(screen.getByTestId('logsDrilldownSourceCardCheckbox-app/web/a')).not.toBeDisabled();
  });

  it("names the item in each Run button's accessible label", async () => {
    renderView(makeDrilldown());
    expect(await screen.findByTestId('logsDrilldownSourceCardRun-app/api/b')).toHaveAttribute(
      'aria-label',
      'Run app/api/b'
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
      expect(screen.queryByTestId('logsDrilldownSourceCardRun-app/api/b')).not.toBeInTheDocument();
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

  describe('an item the source marks unavailable', () => {
    const withUnavailable = (overrides: Record<string, any> = {}) =>
      makeDrilldown({
        listItems: jest.fn().mockResolvedValue({
          items: [
            { id: 'app/web/a', name: 'app/web/a' },
            {
              id: 'app/api/b',
              name: 'app/api/b',
              unavailable: { title: "Can't be queried", reason: 'Ask for access to it.' },
            },
          ],
        }),
        ...overrides,
      });

    it('shows why on its card, offers no Run, and never queries it', async () => {
      const drilldown = withUnavailable();
      renderView(drilldown);
      expect(
        await screen.findByTestId('logsDrilldownSourceCardUnavailable-app/api/b')
      ).toHaveTextContent("Can't be queried");
      expect(screen.queryByTestId('logsDrilldownSourceCardRun-app/api/b')).not.toBeInTheDocument();

      // The other card still runs, and only it queries.
      fireEvent.click(screen.getByTestId('logsDrilldownSourceCardRun-app/web/a'));
      await screen.findByTestId('logsDrilldownSourceCardLogs-app/web/a');
      expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
      expect(drilldown.fetchHistogram).toHaveBeenCalledTimes(1);
      expect(drilldown.toDataset).toHaveBeenCalledTimes(1);
      expect(drilldown.toDataset).toHaveBeenCalledWith({
        scope: { zone: 'zone-a' },
        items: [expect.objectContaining({ id: 'app/web/a' })],
      });
    });

    it('is never run as it scrolls into view on a source that runs on its own', async () => {
      mockRequiresExplicitRun = false;
      const observers = installIntersectionObserver();
      jest.useFakeTimers();
      try {
        const drilldown = withUnavailable();
        renderView(drilldown);
        await act(async () => {
          await Promise.resolve();
        });
        act(() => observers.forEach((callback) => callback([{ isIntersecting: true }])));
        await act(async () => {
          jest.advanceTimersByTime(500);
        });
        expect(drilldown.fetchPreview).toHaveBeenCalledTimes(1);
        expect(drilldown.buildPreviewQuery).toHaveBeenCalledTimes(1);
        expect(drilldown.buildPreviewQuery).toHaveBeenCalledWith(
          expect.objectContaining({ item: expect.objectContaining({ id: 'app/web/a' }) })
        );
        expect(
          screen.getByTestId('logsDrilldownSourceCardUnavailable-app/api/b')
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId('logsDrilldownSourceCardError-app/api/b')
        ).not.toBeInTheDocument();
      } finally {
        jest.useRealTimers();
        delete (global as any).IntersectionObserver;
      }
    });

    it("can't be ticked for the Logs page", async () => {
      const { onBatchActionChange } = renderView(withUnavailable());
      const box = await screen.findByTestId('logsDrilldownSourceCardCheckbox-app/api/b');
      expect(box).toBeDisabled();
      fireEvent.click(box);
      expect(onBatchActionChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ label: expect.stringContaining('in Logs') })
      );
      expect(screen.getByTestId('logsDrilldownSourceCardCheckbox-app/web/a')).not.toBeDisabled();
    });

    it('lists as before without the field (no change for other sources)', async () => {
      const drilldown = makeDrilldown();
      renderView(drilldown);
      await screen.findByTestId('logsDrilldownSourceCard-app/api/b');
      expect(screen.queryByTestId(/logsDrilldownSourceCardUnavailable-/)).not.toBeInTheDocument();
      expect(screen.getByTestId('logsDrilldownSourceCardRun-app/api/b')).toBeInTheDocument();
      expect(screen.getByTestId('logsDrilldownSourceCardCheckbox-app/api/b')).not.toBeDisabled();
    });
  });
});
