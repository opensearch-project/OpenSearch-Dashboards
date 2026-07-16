/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { Subject } from 'rxjs';
import { LogsDrilldownPage } from './logs_drilldown_page';

jest.mock('@osd/i18n', () => ({
  i18n: { translate: (_k: string, o: { defaultMessage: string }) => o.defaultMessage },
}));

// Capture the props RowsView receives so we can assert the page's orchestration + drive onBrushTime.
let lastRowsProps: any;
jest.mock('./components/rows_view', () => ({
  RowsView: (props: any) => {
    lastRowsProps = props;
    return <div data-test-subj="mock-rows-view" data-refresh-key={props.refreshKey} />;
  },
}));
// Portal renders its children inline in jsdom, so header-portaled controls are still queryable.
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  MountPointPortal: ({ children }: any) => (
    <div data-test-subj="mock-header-portal">{children}</div>
  ),
}));
// DataSourceControl → expose buttons that trigger a data-source change (resolve to a concrete
// source, or report an empty selection like an empty workspace does).
jest.mock('./components/data_source_control', () => ({
  DataSourceControl: ({ onChange }: any) => (
    <>
      <button data-test-subj="ds-change" onClick={() => onChange({ id: 'ds-2', title: 'C2' })}>
        ds
      </button>
      <button data-test-subj="ds-empty" onClick={() => onChange({ id: '', title: undefined })}>
        ds-empty
      </button>
    </>
  ),
}));
jest.mock('./hooks/use_index_classification', () => ({
  useIndexClassification: () => ({ classify: jest.fn(), getCached: jest.fn() }),
}));
// Stub the data plugin barrel (importing it whole breaks in jsdom via its UI components). The page
// only needs syncQueryStateWithUrl from it.
const mockSyncQueryStateWithUrl = jest.fn(() => ({ stop: jest.fn() }));
jest.mock('../../../../../data/public', () => ({
  syncQueryStateWithUrl: (...args: any[]) => mockSyncQueryStateWithUrl(...args),
}));

const setTime = jest.fn();
const timeUpdate$ = new Subject<void>();
let currentTime = { from: 'now-15m', to: 'now' };

const setBreadcrumbs = jest.fn();

const makeServices = (
  opts: { mds?: boolean; dataSourceTotal?: number; urlStateStorage?: any } = {}
) =>
  (({
    chrome: { setBreadcrumbs },
    // MDS on ⇒ dataSourceManagement.ui.DataSourceSelector is present (the page's mdsEnabled gate).
    dataSourceManagement: opts.mds ? { ui: { DataSourceSelector: () => null } } : undefined,
    // The page queries data-source existence to pick the right empty-state copy (none vs. unselected).
    savedObjects: {
      client: { find: jest.fn().mockResolvedValue({ total: opts.dataSourceTotal ?? 1 }) },
    },
    uiSettings: { get: jest.fn() },
    // URL state storage (present in the real drilldown mount) → _g time sync + _a data-source persist.
    osdUrlStateStorage: opts.urlStateStorage,
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: () => currentTime,
            setTime,
            getTimeUpdate$: () => timeUpdate$,
            getBounds: () => ({}),
          },
        },
      },
    },
  } as unknown) as any);

// A minimal in-memory osdUrlStateStorage stub for the URL-state tests.
const makeUrlStateStorage = (initial: Record<string, any> = {}) => {
  const store: Record<string, any> = { ...initial };
  return {
    get: jest.fn((key: string) => store[key] ?? null),
    set: jest.fn((key: string, value: any) => {
      store[key] = value;
    }),
    _store: store,
  };
};

describe('LogsDrilldownPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastRowsProps = undefined;
    currentTime = { from: 'now-15m', to: 'now' };
  });

  it('renders the toolbar + RowsView and threads the initial time range into refreshKey', () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    expect(screen.getByTestId('logsDrilldownPage')).toBeInTheDocument();
    expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
    // refreshKey now carries a manual-refresh nonce (starts at 0).
    expect(lastRowsProps.refreshKey).toBe('now-15m|now|0');
  });

  it('sets the "Logs drilldown" breadcrumb on mount', () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    expect(setBreadcrumbs).toHaveBeenCalledWith([{ text: 'Logs drilldown' }]);
  });

  it('updates refreshKey when the global time range changes (timeUpdate$)', async () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    expect(lastRowsProps.refreshKey).toBe('now-15m|now|0');

    // Simulate the timepicker publishing a new range.
    currentTime = { from: 'now-1h', to: 'now' };
    act(() => timeUpdate$.next());

    await waitFor(() => expect(lastRowsProps.refreshKey).toBe('now-1h|now|0'));
  });

  it('the toolbar batch button is disabled until RowsView reports a batch action', () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    const btn = screen.getByTestId('logsExploreToolbarBatch');
    expect(btn).toBeDisabled();
    // RowsView reports a selection → button enables + adopts the label.
    act(() =>
      lastRowsProps.onBatchActionChange({
        count: 2,
        label: 'Query (2)',
        pattern: 'x',
        onClick: jest.fn(),
      })
    );
    expect(screen.getByTestId('logsExploreToolbarBatch')).not.toBeDisabled();
    expect(screen.getByTestId('logsExploreToolbarBatch')).toHaveTextContent('Query (2)');
  });

  it('the batch button runs the reported onClick', () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    const onClick = jest.fn();
    act(() =>
      lastRowsProps.onBatchActionChange({
        count: 1,
        label: 'Create dataset (1)',
        pattern: 'x',
        onClick,
      })
    );
    fireEvent.click(screen.getByTestId('logsExploreToolbarBatch'));
    expect(onClick).toHaveBeenCalled();
  });

  it('brush-select on a card sets the global time range (ISO)', () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    act(() => lastRowsProps.onBrushTime(0, 60_000));
    expect(setTime).toHaveBeenCalledWith({
      from: new Date(0).toISOString(),
      to: new Date(60_000).toISOString(),
    });
  });

  it('changing the data source flows a dataSourceId into RowsView', async () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    expect(lastRowsProps.dataSourceId).toBeUndefined();
    fireEvent.click(screen.getByTestId('ds-change'));
    await waitFor(() => expect(lastRowsProps.dataSourceId).toBe('ds-2'));
  });

  it('syncs the global time range with the URL (_g) when url state storage is present', () => {
    const urlStateStorage = makeUrlStateStorage();
    render(<LogsDrilldownPage services={makeServices({ urlStateStorage })} />);
    expect(mockSyncQueryStateWithUrl).toHaveBeenCalledWith(
      expect.anything(),
      urlStateStorage,
      expect.anything()
    );
  });

  it('persists the selected data source to the _a URL key on change', async () => {
    const urlStateStorage = makeUrlStateStorage();
    render(<LogsDrilldownPage services={makeServices({ urlStateStorage })} />);
    fireEvent.click(screen.getByTestId('ds-change'));
    await waitFor(() => expect(lastRowsProps.dataSourceId).toBe('ds-2'));
    expect(urlStateStorage.set).toHaveBeenCalledWith(
      '_a',
      { dataSource: expect.objectContaining({ id: 'ds-2' }) },
      { replace: true }
    );
  });

  it('restores the selected data source from the _a URL key on mount', () => {
    const urlStateStorage = makeUrlStateStorage({
      _a: { dataSource: { id: 'ds-restored', title: 'Restored', type: 'DATA_SOURCE' } },
    });
    render(<LogsDrilldownPage services={makeServices({ urlStateStorage })} />);
    // The restored data source flows straight into RowsView (no user interaction needed).
    expect(lastRowsProps.dataSourceId).toBe('ds-restored');
  });

  it('non-MDS: shows the index list (implicit local cluster is the queryable target)', () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
    expect(screen.queryByTestId('logsDrilldownNoDataSource')).not.toBeInTheDocument();
  });

  it('MDS, sources exist but none selected: NO index list, shows the SELECT prompt', async () => {
    render(<LogsDrilldownPage services={makeServices({ mds: true, dataSourceTotal: 3 })} />);
    // Local cluster is hidden under MDS, so nothing is queryable until a source is selected — we
    // must NOT fall back to local-cluster indexes.
    expect(screen.queryByTestId('mock-rows-view')).not.toBeInTheDocument();
    // Sources exist → prompt to select, not the "none available" copy.
    await waitFor(() =>
      expect(screen.getByTestId('logsDrilldownSelectDataSource')).toBeInTheDocument()
    );
    expect(screen.queryByTestId('logsDrilldownNoDataSource')).not.toBeInTheDocument();
    // An empty selection keeps it gated on the select prompt.
    fireEvent.click(screen.getByTestId('ds-empty'));
    expect(screen.queryByTestId('mock-rows-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('logsDrilldownSelectDataSource')).toBeInTheDocument();
  });

  it('MDS, NO sources in the workspace: shows the "none available" prompt (not select)', async () => {
    render(<LogsDrilldownPage services={makeServices({ mds: true, dataSourceTotal: 0 })} />);
    await waitFor(() =>
      expect(screen.getByTestId('logsDrilldownNoDataSource')).toBeInTheDocument()
    );
    expect(screen.queryByTestId('logsDrilldownSelectDataSource')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-rows-view')).not.toBeInTheDocument();
  });

  it('MDS: resolving a real data source reveals the index list', async () => {
    render(<LogsDrilldownPage services={makeServices({ mds: true })} />);
    expect(screen.getByTestId('logsDrilldownSelectDataSource')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ds-change'));
    await waitFor(() => expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument());
    expect(screen.queryByTestId('logsDrilldownSelectDataSource')).not.toBeInTheDocument();
    expect(lastRowsProps.dataSourceId).toBe('ds-2');
  });

  it('debounces the search input before passing it to RowsView', async () => {
    render(<LogsDrilldownPage services={makeServices()} />);
    const searchBox = screen.getByLabelText('Search datasets and indexes');
    fireEvent.change(searchBox, { target: { value: 'logs' } });
    // Debounced: the search prop only updates after the debounce window elapses.
    await waitFor(() => expect(lastRowsProps.search).toBe('logs'));
  });

  it('unsubscribes from timeUpdate$ on unmount (no leak / late update)', () => {
    const { unmount } = render(<LogsDrilldownPage services={makeServices()} />);
    expect(timeUpdate$.observers.length).toBe(1);
    unmount();
    expect(timeUpdate$.observers.length).toBe(0);
  });
});
