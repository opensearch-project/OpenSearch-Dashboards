/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { Subject } from 'rxjs';
import { LogsDrilldownPage } from './logs_drilldown_page';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_k: string, o: { defaultMessage: string; values?: Record<string, unknown> }) =>
      Object.entries(o.values ?? {}).reduce(
        (text, [key, value]) => text.replace(`{${key}}`, String(value)),
        o.defaultMessage
      ),
  },
}));
jest.mock('./components/rows_view', () => ({
  RowsView: () => <div data-test-subj="mock-rows-view" />,
}));
let lastSourceRowsProps: any;
jest.mock('./components/source_rows_view', () => ({
  SourceRowsView: (props: any) => {
    lastSourceRowsProps = props;
    return <div data-test-subj="mock-source-rows-view" />;
  },
}));
jest.mock('./components/source_type_control', () => ({
  SourceTypeControl: ({ options, selectedId, onChange }: any) => (
    <div data-test-subj="mock-source-type-control" data-selected={selectedId}>
      {options.map((option: any) => (
        <button
          key={option.id}
          data-test-subj={`pick-${option.id}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  MountPointPortal: ({ children }: any) => <div>{children}</div>,
}));
let lastDataSourceControlProps: any;
let mockDataSourceControlMounts = 0;
jest.mock('./components/data_source_control', () => ({
  DataSourceControl: (props: any) => {
    lastDataSourceControlProps = props;
    // Counts mounts, so a test can tell a remount from a re-render.
    jest.requireActual('react').useEffect(() => {
      mockDataSourceControlMounts++;
    }, []);
    return (
      <button
        data-test-subj="mock-data-source-control"
        onClick={() => props.onChange({ id: 'ds-picked', title: 'picked' })}
      />
    );
  },
}));
jest.mock('./hooks/use_index_classification', () => ({
  useIndexClassification: () => ({ classify: jest.fn(), getCached: jest.fn() }),
}));
jest.mock('../../../../../data/public', () => ({
  syncQueryStateWithUrl: () => ({ stop: jest.fn() }),
}));

// A registered source with a scope picker that reports its default scope on mount.
const MockScopeSelector = ({ scope, onChange }: any) => {
  React.useEffect(() => {
    if (!scope) onChange({ zone: 'zone-a' });
  }, [scope, onChange]);
  return <div data-test-subj="mock-scope-selector" data-scope={JSON.stringify(scope ?? null)} />;
};
const mockFakeSource = {
  id: 'fake-logs',
  label: 'Fake Logs',
  datasetTypes: ['FAKE_LOGS'],
  resolveDefaultDataset: jest.fn(),
  logsDrilldown: {
    ScopeSelector: MockScopeSelector,
    searchPlaceholder: 'Search fake groups…',
    listItems: jest.fn(),
    fetchPreview: jest.fn(),
    toDataset: jest.fn(),
  },
};
const mockSourceWithoutDrilldown = {
  id: 'other',
  label: 'Other',
  datasetTypes: ['OTHER'],
  resolveDefaultDataset: jest.fn(),
};
const mockOpenSearch = { id: 'opensearch', label: 'OpenSearch', datasetTypes: ['INDEX'] };
let mockRegistered: any[] = [];
jest.mock('../../../services/source_type_registry', () => ({
  OPENSEARCH_SOURCE_TYPE_ID: 'opensearch',
  getSourceTypeRegistry: () => ({
    getAll: () => mockRegistered,
    getLabel: (sourceType: any) => sourceType.label,
  }),
}));

const timeUpdate$ = new Subject<void>();
/** Sorts object keys at every level, as rison does when `_a` goes through the URL. */
const risonOrder = (value: any): any =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value)
        .sort()
        .reduce((sorted: any, key) => ({ ...sorted, [key]: risonOrder(value[key]) }), {})
    : value;

const makeUrlStateStorage = (
  initial: Record<string, any> = {},
  { syncChanges = false, sortKeys = false }: { syncChanges?: boolean; sortKeys?: boolean } = {}
) => {
  const store: Record<string, any> = { ...initial };
  const changes = new Subject<any>();
  return {
    get: jest.fn((key: string) => store[key] ?? null),
    set: jest.fn((key: string, written: any) => {
      const value = sortKeys ? risonOrder(written) : written;
      store[key] = value;
      // Like the real storage, the change comes back a microtask later; `syncChanges` reports it
      // before React re-renders (the window where the page's state lags the URL).
      if (syncChanges) changes.next(value);
      else Promise.resolve().then(() => changes.next(value));
    }),
    change$: () => changes.asObservable(),
    // A change the page didn't make (a hand-edited URL, back/forward).
    external: (value: any) => {
      store._a = value;
      changes.next(value);
    },
    store,
  };
};
const makeServices = (urlStateStorage?: any, { mds = false }: { mds?: boolean } = {}) =>
  ({
    chrome: { setBreadcrumbs: jest.fn() },
    // MDS on: the data source picker exists, and the OpenSearch list waits for it to resolve.
    dataSourceManagement: mds ? { ui: { DataSourceSelector: () => null } } : undefined,
    savedObjects: { client: { find: jest.fn().mockResolvedValue({ total: 1 }) } },
    uiSettings: { get: jest.fn() },
    osdUrlStateStorage: urlStateStorage,
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: () => ({ from: 'now-15m', to: 'now' }),
            setTime: jest.fn(),
            getTimeUpdate$: () => timeUpdate$,
            getBounds: () => ({}),
          },
        },
      },
    },
  }) as unknown as any;

describe('LogsDrilldownPage source types', () => {
  beforeEach(() => {
    lastSourceRowsProps = undefined;
    window.sessionStorage.clear();
    mockRegistered = [mockOpenSearch, mockFakeSource];
  });

  it('offers no source type picker when only OpenSearch supports the page', () => {
    mockRegistered = [mockOpenSearch, mockSourceWithoutDrilldown];
    render(<LogsDrilldownPage services={makeServices()} />);
    expect(screen.queryByTestId('mock-source-type-control')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-data-source-control')).toBeInTheDocument();
    expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
  });

  it('lists OpenSearch and the sources that support the page, OpenSearch selected', () => {
    mockRegistered = [mockOpenSearch, mockFakeSource, mockSourceWithoutDrilldown];
    render(<LogsDrilldownPage services={makeServices()} />);
    const control = screen.getByTestId('mock-source-type-control');
    expect(control).toHaveAttribute('data-selected', 'opensearch');
    expect(screen.getByTestId('pick-opensearch')).toBeInTheDocument();
    expect(screen.getByTestId('pick-fake-logs')).toBeInTheDocument();
    expect(screen.queryByTestId('pick-other')).not.toBeInTheDocument();
  });

  it("switching to a registered source shows its scope picker and lists in the picker's scope", () => {
    const url = makeUrlStateStorage();
    render(<LogsDrilldownPage services={makeServices(url)} />);
    fireEvent.click(screen.getByTestId('pick-fake-logs'));

    expect(screen.queryByTestId('mock-data-source-control')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-scope-selector')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search fake groups…')).toBeInTheDocument();
    expect(screen.getByTestId('mock-source-rows-view')).toBeInTheDocument();
    expect(lastSourceRowsProps.sourceType.id).toBe('fake-logs');
    expect(lastSourceRowsProps.scope).toEqual({ zone: 'zone-a' });
    expect(url.store._a).toEqual({ sourceType: 'fake-logs', scope: { zone: 'zone-a' } });
  });

  it('restores the source type and scope from the URL', () => {
    const url = makeUrlStateStorage({
      _a: { sourceType: 'fake-logs', scope: { zone: 'zone-c' } },
    });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    expect(screen.getByTestId('mock-source-type-control')).toHaveAttribute(
      'data-selected',
      'fake-logs'
    );
    expect(lastSourceRowsProps.scope).toEqual({ zone: 'zone-c' });
  });

  it('falls back to OpenSearch for a source type that is no longer mockRegistered', () => {
    const url = makeUrlStateStorage({ _a: { sourceType: 'gone', scope: { zone: 'x' } } });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    expect(screen.getByTestId('mock-source-type-control')).toHaveAttribute(
      'data-selected',
      'opensearch'
    );
    expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
  });

  it('a URL `_a` without a source type opens OpenSearch, over the tab session', () => {
    window.sessionStorage.setItem(
      'logsDrilldown.source',
      JSON.stringify({ sourceType: 'fake-logs', scope: { zone: 'x' } })
    );
    const url = makeUrlStateStorage({ _a: { dataSource: { id: 'ds-1', title: 'one' } } });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    expect(screen.getByTestId('mock-source-type-control')).toHaveAttribute(
      'data-selected',
      'opensearch'
    );
  });

  it('comes back to OpenSearch on the data source picked, not the one the page opened with', () => {
    const url = makeUrlStateStorage({ _a: { dataSource: { id: 'ds-1', title: 'one' } } });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    fireEvent.click(screen.getByTestId('mock-data-source-control'));
    fireEvent.click(screen.getByTestId('pick-fake-logs'));
    fireEvent.click(screen.getByTestId('pick-opensearch'));
    expect(lastDataSourceControlProps.defaultDataSourceId).toBe('ds-picked');
  });

  it('follows a URL change it did not make', () => {
    const url = makeUrlStateStorage({ _a: { sourceType: 'fake-logs', scope: { zone: 'zone-1' } } });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    expect(lastSourceRowsProps.scope).toEqual({ zone: 'zone-1' });
    act(() => url.external({ sourceType: 'fake-logs', scope: { zone: 'zone-2' } }));
    expect(lastSourceRowsProps.scope).toEqual({ zone: 'zone-2' });
    act(() => url.external({ dataSource: { id: 'ds-9', title: 'nine' } }));
    expect(screen.getByTestId('mock-source-type-control')).toHaveAttribute(
      'data-selected',
      'opensearch'
    );
    expect(lastDataSourceControlProps.defaultDataSourceId).toBe('ds-9');
  });

  it("doesn't remount the data source picker for its own URL write", async () => {
    const url = makeUrlStateStorage(
      { _a: { dataSource: { id: 'ds-1', title: 'one' } } },
      { syncChanges: true }
    );
    render(<LogsDrilldownPage services={makeServices(url)} />);
    const mountsBefore = mockDataSourceControlMounts;
    fireEvent.click(screen.getByTestId('mock-data-source-control'));
    await act(async () => {
      await Promise.resolve();
    });
    // The page's own `_a` write came back through change$; the picker must not be remounted.
    expect(lastDataSourceControlProps.defaultDataSourceId).toBe('ds-picked');
    expect(mockDataSourceControlMounts).toBe(mountsBefore);
  });

  it('remembers the source with its own scope, and restores both together', async () => {
    const url = makeUrlStateStorage();
    const { unmount } = render(<LogsDrilldownPage services={makeServices(url)} />);
    fireEvent.click(screen.getByTestId('pick-fake-logs'));
    expect(JSON.parse(window.sessionStorage.getItem('logsDrilldown.source') || 'null')).toEqual({
      sourceType: 'fake-logs',
      scope: { zone: 'zone-a' },
    });
    unmount();
    // Re-entry from a bare `#/` (no `_a`): the source and its scope come back together.
    render(<LogsDrilldownPage services={makeServices(makeUrlStateStorage())} />);
    expect(lastSourceRowsProps.scope).toEqual({ zone: 'zone-a' });
  });

  it('clears the search when the URL switches the source', () => {
    const url = makeUrlStateStorage();
    render(<LogsDrilldownPage services={makeServices(url)} />);
    fireEvent.change(screen.getByPlaceholderText('Search datasets and indexes…'), {
      target: { value: 'abc' },
    });
    act(() => url.external({ sourceType: 'fake-logs', scope: { zone: 'zone-2' } }));
    expect(screen.getByPlaceholderText('Search fake groups…')).toHaveValue('');
  });

  it('reads its own write of a two-key scope back as the same scope (rison sorts keys)', async () => {
    const TwoKeyScope = ({ scope, onChange }: any) => {
      React.useEffect(() => {
        if (!scope) onChange({ zone: 'zone-a', tenant: '123' });
      }, [scope, onChange]);
      return null;
    };
    mockRegistered = [
      mockOpenSearch,
      {
        ...mockFakeSource,
        logsDrilldown: { ...mockFakeSource.logsDrilldown, ScopeSelector: TwoKeyScope },
      },
    ];
    const url = makeUrlStateStorage({}, { sortKeys: true });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    fireEvent.click(screen.getByTestId('pick-fake-logs'));
    const scopeBefore = lastSourceRowsProps.scope;
    await act(async () => {
      await Promise.resolve();
    });
    // The URL now holds `{ tenant, zone }`; the page keeps its own scope object.
    expect(url.store._a.scope).toEqual({ tenant: '123', zone: 'zone-a' });
    expect(lastSourceRowsProps.scope).toBe(scopeBefore);
  });

  describe('with MDS on', () => {
    it('comes back to OpenSearch on the data source in use, resolved, after another source', () => {
      const url = makeUrlStateStorage({ _a: { dataSource: { id: 'ds-1', title: 'one' } } });
      render(<LogsDrilldownPage services={makeServices(url, { mds: true })} />);
      expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('pick-fake-logs'));
      fireEvent.click(screen.getByTestId('pick-opensearch'));
      expect(lastDataSourceControlProps.defaultDataSourceId).toBe('ds-1');
      expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
    });

    it("doesn't list an outside data source until the picker confirms it", () => {
      const url = makeUrlStateStorage({ _a: { dataSource: { id: 'ds-1', title: 'one' } } });
      render(<LogsDrilldownPage services={makeServices(url, { mds: true })} />);
      const mountsBefore = mockDataSourceControlMounts;
      act(() => url.external({ dataSource: { id: 'ds-gone', title: 'gone' } }));
      // Remounted to validate the id, and the indexes wait for its answer.
      expect(mockDataSourceControlMounts).toBe(mountsBefore + 1);
      expect(lastDataSourceControlProps.defaultDataSourceId).toBe('ds-gone');
      expect(screen.queryByTestId('mock-rows-view')).not.toBeInTheDocument();
      // The picker falls back to a data source that exists.
      fireEvent.click(screen.getByTestId('mock-data-source-control'));
      expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
    });
  });

  it("keeps the page when the source's scope picker throws", () => {
    const failing = {
      ...mockFakeSource,
      logsDrilldown: {
        ...mockFakeSource.logsDrilldown,
        ScopeSelector: () => {
          throw new Error('picker broke');
        },
      },
    };
    mockRegistered = [mockOpenSearch, failing];
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(<LogsDrilldownPage services={makeServices(makeUrlStateStorage())} />);
      fireEvent.click(screen.getByTestId('pick-fake-logs'));
      expect(screen.getByTestId('logsDrilldownPage')).toBeInTheDocument();
      expect(screen.getByTestId('mock-source-type-control')).toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });

  it('keeps the data source in the URL when switching source types', () => {
    const url = makeUrlStateStorage({ _a: { dataSource: { id: 'ds-1', title: 'one' } } });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    fireEvent.click(screen.getByTestId('pick-fake-logs'));
    fireEvent.click(screen.getByTestId('pick-opensearch'));
    expect(url.store._a.dataSource).toEqual({ id: 'ds-1', title: 'one' });
    expect(url.store._a.sourceType).toBeUndefined();
    expect(screen.getByTestId('mock-rows-view')).toBeInTheDocument();
  });
});
