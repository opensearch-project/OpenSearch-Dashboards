/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RowsView } from './rows_view';
import { IndexClassification } from '../types';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_k: string, o: { defaultMessage: string; values?: any }) => {
      let m = o.defaultMessage;
      if (o.values)
        Object.entries(o.values).forEach(([k, v]) => (m = m.replace(`{${k}}`, String(v))));
      return m;
    },
  },
}));

const mockDatasets = jest.fn();
const mockIndexList = jest.fn();
jest.mock('../hooks/use_dataset_list', () => ({ useDatasetList: () => mockDatasets() }));
jest.mock('../hooks/use_index_list', () => ({ useIndexList: () => mockIndexList() }));

const mockCreate = jest.fn();
const mockActivate = jest.fn();
jest.mock('../hooks/use_create_dataset', () => ({ useCreateDataset: () => mockCreate }));
jest.mock('../hooks/use_activate_dataset', () => ({ useActivateDataset: () => mockActivate }));

// Deterministic no-fetch concurrency stub. `mockResults` lets a test inject per-card histogram
// results (e.g. a zero-total histogram → NO_RECENT) to exercise liveness/banner behavior.
const mockInvalidate = jest.fn();
let mockResults = new Map<string, any>();
jest.mock('../../metrics/explore/hooks/use_concurrent_queries', () => ({
  useConcurrentQueries: () => ({
    results: mockResults,
    errors: new Map(),
    onVisibilityChange: jest.fn(),
    invalidate: mockInvalidate,
  }),
}));

/** Build a resolved concurrency result whose histogram totals sum to `total`. */
const resultWithTotal = (total: number) => ({
  preview: { columns: [], rows: [] },
  histogram: { series: [], intervalMs: 1, from: 0, to: 1, totals: [{ name: 'count', total }] },
});

// Render each card as its name + primary label + a select toggle so we can assert ordering,
// action wiring, and multi-select. Also surface the time-field props so we can drive/observe the
// per-card time-field override wiring.
jest.mock('./log_stream_card', () => ({
  LogStreamCard: ({
    name,
    kind,
    primaryLabel,
    onPrimary,
    checked,
    onToggleCheck,
    rowState,
    timeFieldName,
    dateFields,
    onTimeFieldChange,
    onManage,
    health,
    severityField,
  }: any) => (
    <div
      data-test-subj={`card-${name}`}
      data-kind={kind}
      data-checked={String(Boolean(checked))}
      data-row-state={rowState}
      data-time-field={timeFieldName ?? ''}
      data-date-fields={(dateFields ?? []).join(',')}
      data-health={health ?? ''}
      data-severity-field={severityField ?? ''}
    >
      {onPrimary && (
        <button data-test-subj={`primary-${name}`} onClick={onPrimary}>
          {primaryLabel}
        </button>
      )}
      <button data-test-subj={`check-${name}`} onClick={onToggleCheck}>
        select
      </button>
      {onTimeFieldChange && (
        <button
          data-test-subj={`tf-${name}`}
          onClick={() => onTimeFieldChange('observedTimestamp')}
        >
          change tf
        </button>
      )}
      {onManage && (
        <button data-test-subj={`manage-${name}`} onClick={onManage}>
          manage
        </button>
      )}
    </div>
  ),
}));

const navigateToApp = jest.fn();
const services = {
  data: { query: { timefilter: { timefilter: { getBounds: () => ({}) } } } },
  core: { application: { navigateToApp } },
} as any;

// Capture the most recent batch action reported up to the toolbar.
let lastBatchAction: any;

const renderRows = (extra: Partial<React.ComponentProps<typeof RowsView>> = {}) =>
  render(
    <RowsView
      services={services}
      search=""
      refreshKey="t0"
      classify={jest.fn()}
      getCached={() => ({
        classification: IndexClassification.TIME_BASED,
        timeFieldName: '@timestamp',
      })}
      onBrushTime={jest.fn()}
      rangeFrom={Date.parse('2026-07-15T00:00:00Z')}
      rangeTo={Date.parse('2026-07-15T00:15:00Z')}
      onBatchActionChange={(a) => {
        lastBatchAction = a;
      }}
      {...extra}
    />
  );

describe('RowsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastBatchAction = undefined;
    mockResults = new Map();
    mockDatasets.mockReturnValue({
      datasets: [
        { name: 'logs-app-*', kind: 'dataset', datasetId: 'ds1', timeFieldName: '@timestamp' },
      ],
      loading: false,
    });
    mockIndexList.mockReturnValue({
      items: [
        { name: 'logs-app-2026.07.09', kind: 'index' },
        { name: 'orders-2026', kind: 'index' },
      ],
      loading: false,
      error: undefined,
      hasNext: false,
      loadMore: jest.fn(),
    });
  });

  it('renders datasets before indexes', () => {
    renderRows();
    const cards = screen.getAllByTestId(/^card-/);
    expect(cards[0].getAttribute('data-test-subj')).toBe('card-logs-app-*');
    expect(cards[0].getAttribute('data-kind')).toBe('dataset');
    // Indexes follow.
    expect(screen.getByTestId('card-orders-2026')).toBeInTheDocument();
  });

  it('dataset card → Query action', () => {
    renderRows();
    fireEvent.click(screen.getByTestId('primary-logs-app-*'));
    expect(mockActivate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'logs-app-*', datasetId: 'ds1' })
    );
  });

  it('dataset card → Manage opens the dataset in the Datasets management app', () => {
    renderRows();
    fireEvent.click(screen.getByTestId('manage-logs-app-*'));
    expect(navigateToApp).toHaveBeenCalledWith('datasets', {
      path: '/patterns/ds1',
    });
  });

  it('index cards get no Manage action (datasets only)', () => {
    renderRows();
    expect(screen.queryByTestId('manage-orders-2026')).not.toBeInTheDocument();
  });

  it('passes index health down to index cards', () => {
    mockDatasets.mockReturnValue({ datasets: [], loading: false });
    mockIndexList.mockReturnValue({
      items: [{ name: 'orders-2026', kind: 'index', health: 'yellow' }],
      loading: false,
    });
    renderRows();
    expect(screen.getByTestId('card-orders-2026').getAttribute('data-health')).toBe('yellow');
  });

  it('index covered by a dataset → Query (via covering dataset)', () => {
    renderRows();
    // logs-app-2026.07.09 is covered by dataset logs-app-*
    fireEvent.click(screen.getByTestId('primary-logs-app-2026.07.09'));
    expect(mockActivate).toHaveBeenCalledWith(expect.objectContaining({ title: 'logs-app-*' }));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('uncovered index → Create dataset (seeded with the wildcard-reduced family)', () => {
    renderRows();
    // orders-2026 is not covered by logs-app-*; the create flow is seeded with the reduced family
    // (orders-2026 → orders-*) so browsing one day doesn't create a one-index dataset.
    fireEvent.click(screen.getByTestId('primary-orders-2026'));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ pattern: 'orders-*' }));
  });

  it('multi-select reports a Create-dataset batch action up (wildcard union), no selection bar', () => {
    mockIndexList.mockReturnValue({
      items: [
        { name: 'app-svc-1', kind: 'index' },
        { name: 'app-svc-2', kind: 'index' },
      ],
      loading: false,
      hasNext: false,
      loadMore: jest.fn(),
    });
    mockDatasets.mockReturnValue({ datasets: [], loading: false });
    renderRows();
    // The old sticky selection bar is gone.
    expect(screen.queryByTestId('logsExploreSelectionBar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('check-app-svc-1'));
    fireEvent.click(screen.getByTestId('check-app-svc-2'));
    // The batch action is reported up to the toolbar: uncovered → Create dataset (2), union app-svc-*.
    expect(lastBatchAction).toEqual(
      expect.objectContaining({ count: 2, label: 'Create dataset (2)', pattern: 'app-svc-*' })
    );
    lastBatchAction.onClick();
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ pattern: 'app-svc-*' }));
  });

  it('multi-select of indexes all covered by the SAME dataset reports a Query batch action', () => {
    mockDatasets.mockReturnValue({
      datasets: [
        { name: 'logs-app-*', kind: 'dataset', datasetId: 'ds1', timeFieldName: '@timestamp' },
      ],
      loading: false,
    });
    mockIndexList.mockReturnValue({
      items: [
        { name: 'logs-app-2026.07.08', kind: 'index' },
        { name: 'logs-app-2026.07.09', kind: 'index' },
      ],
      loading: false,
      hasNext: false,
      loadMore: jest.fn(),
    });
    renderRows();
    fireEvent.click(screen.getByTestId('check-logs-app-2026.07.08'));
    fireEvent.click(screen.getByTestId('check-logs-app-2026.07.09'));
    expect(lastBatchAction).toEqual(
      expect.objectContaining({ count: 2, label: 'Query (2)', pattern: 'logs-app-*' })
    );
    lastBatchAction.onClick();
    expect(mockActivate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'logs-app-*', datasetId: 'ds1' })
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('a same-named dataset + index do NOT share checked state (checking the index leaves the dataset unchecked)', () => {
    // Real-world case: the `nginx-access-logs` DATASET and the `nginx-access-logs` INDEX coexist.
    mockDatasets.mockReturnValue({
      datasets: [{ name: 'nginx-access-logs', kind: 'dataset', datasetId: 'ds1' }],
      loading: false,
    });
    mockIndexList.mockReturnValue({
      items: [{ name: 'nginx-access-logs', kind: 'index' }],
      loading: false,
      hasNext: false,
      loadMore: jest.fn(),
    });
    renderRows();

    const cardByKind = (kind: string) =>
      Array.from(document.querySelectorAll('[data-test-subj="card-nginx-access-logs"]')).find(
        (el) => el.getAttribute('data-kind') === kind
      )!;

    // Check the INDEX's checkbox.
    const indexCard = cardByKind('index');
    fireEvent.click(indexCard.querySelector('[data-test-subj="check-nginx-access-logs"]')!);

    // The index is checked; the same-named dataset is NOT.
    expect(cardByKind('index').getAttribute('data-checked')).toBe('true');
    expect(cardByKind('dataset').getAttribute('data-checked')).toBe('false');
    // Batch action reflects only the one index.
    expect(lastBatchAction).toEqual(expect.objectContaining({ count: 1 }));
  });

  it('demotes both no-recent and empty-index (0 docs) rows into the dead group', () => {
    mockDatasets.mockReturnValue({ datasets: [], loading: false });
    mockIndexList.mockReturnValue({
      items: [
        { name: 'no-recent', kind: 'index', docsCount: 10 },
        { name: 'empty', kind: 'index', docsCount: 0 }, // dead via docsCount, no fetch needed
        { name: 'live', kind: 'index', docsCount: 10 },
      ],
      loading: false,
      hasNext: false,
      loadMore: jest.fn(),
    });
    mockResults = new Map([
      ['no-recent', resultWithTotal(0)],
      ['live', resultWithTotal(500)],
    ]);
    renderRows();
    // 2 dead (no-recent + empty) demote into the collapsed drawer; the live one stays primary.
    expect(screen.getByTestId('logsExploreDeadGroupToggle')).toHaveTextContent(
      '2 indexes with no recent data'
    );
    expect(screen.getByTestId('card-live')).toBeInTheDocument();
  });

  it('demotes empty-index (0 docs) rows into the collapsed dead group', () => {
    mockDatasets.mockReturnValue({ datasets: [], loading: false });
    mockIndexList.mockReturnValue({
      items: [
        { name: 'live-idx', kind: 'index', docsCount: 100 },
        { name: 'empty-idx', kind: 'index', docsCount: 0 },
      ],
      loading: false,
      hasNext: false,
      loadMore: jest.fn(),
    });
    renderRows();
    // The dead group appears with a count of 1 (the empty index).
    const toggle = screen.getByTestId('logsExploreDeadGroupToggle');
    expect(toggle).toHaveTextContent('1 indexes with no recent data');
    // The empty-index card is not rendered until the drawer is expanded (lazy).
    expect(screen.queryByTestId('card-empty-idx')).not.toBeInTheDocument();
    // The live index is in the primary list.
    expect(screen.getByTestId('card-live-idx')).toBeInTheDocument();
    fireEvent.click(toggle);
    const dead = screen.getByTestId('card-empty-idx');
    expect(dead.getAttribute('data-row-state')).toBe('empty_index');
  });

  it('shows the empty search state when nothing matches', () => {
    mockDatasets.mockReturnValue({ datasets: [], loading: false });
    mockIndexList.mockReturnValue({
      items: [],
      loading: false,
      hasNext: false,
      loadMore: jest.fn(),
    });
    renderRows({ search: 'zzz' });
    expect(screen.getByTestId('logsExploreRowsEmpty')).toHaveTextContent('zzz');
  });

  it('shows the onboarding empty state (no data, no search)', () => {
    mockDatasets.mockReturnValue({ datasets: [], loading: false });
    mockIndexList.mockReturnValue({
      items: [],
      loading: false,
      hasNext: false,
      loadMore: jest.fn(),
    });
    renderRows({ search: '' });
    expect(screen.getByTestId('logsExploreEmptyCreateDataset')).toBeInTheDocument();
  });

  it('renders the Datasets and Indexes section eyebrow labels (no divider)', () => {
    renderRows();
    expect(screen.getByText('Datasets')).toBeInTheDocument();
    expect(screen.getByText('Indexes')).toBeInTheDocument();
    // No divider element between groups (#6) — only the header labels.
    expect(document.querySelector('.euiHorizontalRule')).toBeNull();
  });

  it('passes the classified time field + all date fields down to index cards', () => {
    renderRows({
      getCached: () => ({
        classification: IndexClassification.TIME_BASED,
        timeFieldName: '@timestamp',
        dateFields: ['@timestamp', 'observedTimestamp'],
      }),
    });
    const card = screen.getByTestId('card-orders-2026');
    expect(card.getAttribute('data-time-field')).toBe('@timestamp');
    expect(card.getAttribute('data-date-fields')).toBe('@timestamp,observedTimestamp');
  });

  it('passes the detected severity field down to DATASET cards (for the severity-stacked histogram)', () => {
    // Datasets classify too (a dataset name like `logs-app-*` is a valid field-caps wildcard) so the
    // detected severityField reaches the card — otherwise the dataset histogram renders as plain logs
    // even though the log lines show WARN/INFO tokens.
    renderRows({
      getCached: () => ({
        classification: IndexClassification.TIME_BASED,
        timeFieldName: '@timestamp',
        severityField: 'severityText',
      }),
    });
    const datasetCard = screen.getByTestId('card-logs-app-*');
    expect(datasetCard.getAttribute('data-kind')).toBe('dataset');
    expect(datasetCard.getAttribute('data-severity-field')).toBe('severityText');
  });

  it('applies a per-card time-field override (selector → the card shows the new field)', () => {
    renderRows({
      getCached: () => ({
        classification: IndexClassification.TIME_BASED,
        timeFieldName: '@timestamp',
        dateFields: ['@timestamp', 'observedTimestamp'],
      }),
    });
    const card = () => screen.getByTestId('card-orders-2026');
    expect(card().getAttribute('data-time-field')).toBe('@timestamp');
    // Pick a different field via the (mocked) selector.
    fireEvent.click(screen.getByTestId('tf-orders-2026'));
    expect(card().getAttribute('data-time-field')).toBe('observedTimestamp');
    // Only that card is invalidated — the scheduler is NOT reset (which would refetch every card).
    expect(mockInvalidate).toHaveBeenCalledWith('orders-2026');
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it('does not offer the time-field selector on dataset cards (only indexes)', () => {
    renderRows();
    // Dataset card has no time-field change button; index cards do.
    expect(screen.queryByTestId('tf-logs-app-*')).not.toBeInTheDocument();
    expect(screen.getByTestId('tf-orders-2026')).toBeInTheDocument();
  });

  it('resolves a NO_TIME_FIELD index to the no-time-field row state on the card', () => {
    renderRows({
      getCached: (name: string) =>
        name === 'orders-2026'
          ? { classification: IndexClassification.NO_TIME_FIELD, dateFields: [] }
          : { classification: IndexClassification.TIME_BASED, timeFieldName: '@timestamp' },
    });
    expect(screen.getByTestId('card-orders-2026').getAttribute('data-row-state')).toBe(
      'no_time_field'
    );
    expect(screen.getByTestId('card-logs-app-2026.07.09').getAttribute('data-row-state')).not.toBe(
      'no_time_field'
    );
  });

  it('shows the first 20 rows, then reveals 10 more per Load more click', () => {
    // 35 indexes → first window 20; +10 → 30; +10 → capped at 35 (Load more then disappears).
    const many = Array.from({ length: 35 }, (_, i) => ({
      name: `idx-${String(i).padStart(2, '0')}`,
      kind: 'index' as const,
    }));
    mockDatasets.mockReturnValue({ datasets: [], loading: false });
    mockIndexList.mockReturnValue({ items: many, loading: false });
    renderRows();

    expect(screen.getAllByTestId(/^card-idx-/)).toHaveLength(20);
    fireEvent.click(screen.getByTestId('logsExploreRowsLoadMore'));
    expect(screen.getAllByTestId(/^card-idx-/)).toHaveLength(30); // +10
    fireEvent.click(screen.getByTestId('logsExploreRowsLoadMore'));
    expect(screen.getAllByTestId(/^card-idx-/)).toHaveLength(35); // +10, capped at total
    expect(screen.queryByTestId('logsExploreRowsLoadMore')).not.toBeInTheDocument();
  });

  it('does not show Load more when everything fits in the first window', () => {
    renderRows();
    expect(screen.queryByTestId('logsExploreRowsLoadMore')).not.toBeInTheDocument();
  });
});
