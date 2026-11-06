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
    if (!scope) onChange({ region: 'us-east-1' });
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
const makeUrlStateStorage = (
  initial: Record<string, any> = {},
  { syncChanges = false }: { syncChanges?: boolean } = {}
) => {
  const store: Record<string, any> = { ...initial };
  const changes = new Subject<any>();
  return {
    get: jest.fn((key: string) => store[key] ?? null),
    set: jest.fn((key: string, value: any) => {
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
const makeServices = (urlStateStorage?: any) =>
  ({
    chrome: { setBreadcrumbs: jest.fn() },
    dataSourceManagement: undefined,
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
    expect(lastSourceRowsProps.scope).toEqual({ region: 'us-east-1' });
    expect(url.store._a).toEqual({ sourceType: 'fake-logs', scope: { region: 'us-east-1' } });
  });

  it('restores the source type and scope from the URL', () => {
    const url = makeUrlStateStorage({
      _a: { sourceType: 'fake-logs', scope: { region: 'eu-west-1' } },
    });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    expect(screen.getByTestId('mock-source-type-control')).toHaveAttribute(
      'data-selected',
      'fake-logs'
    );
    expect(lastSourceRowsProps.scope).toEqual({ region: 'eu-west-1' });
  });

  it('falls back to OpenSearch for a source type that is no longer mockRegistered', () => {
    const url = makeUrlStateStorage({ _a: { sourceType: 'gone', scope: { region: 'x' } } });
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
      JSON.stringify({ sourceType: 'fake-logs', scope: { region: 'x' } })
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
    const url = makeUrlStateStorage({ _a: { sourceType: 'fake-logs', scope: { region: 'a-1' } } });
    render(<LogsDrilldownPage services={makeServices(url)} />);
    expect(lastSourceRowsProps.scope).toEqual({ region: 'a-1' });
    act(() => url.external({ sourceType: 'fake-logs', scope: { region: 'b-2' } }));
    expect(lastSourceRowsProps.scope).toEqual({ region: 'b-2' });
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
      scope: { region: 'us-east-1' },
    });
    unmount();
    // Re-entry from a bare `#/` (no `_a`): the source and its scope come back together.
    render(<LogsDrilldownPage services={makeServices(makeUrlStateStorage())} />);
    expect(lastSourceRowsProps.scope).toEqual({ region: 'us-east-1' });
  });

  it('clears the search when the URL switches the source', () => {
    const url = makeUrlStateStorage();
    render(<LogsDrilldownPage services={makeServices(url)} />);
    fireEvent.change(screen.getByPlaceholderText('Search datasets and indexes…'), {
      target: { value: 'abc' },
    });
    act(() => url.external({ sourceType: 'fake-logs', scope: { region: 'b-2' } }));
    expect(screen.getByPlaceholderText('Search fake groups…')).toHaveValue('');
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
