/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogStreamCard, CardData } from './log_stream_card';
import { LogRowState } from '../row_state';

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

jest.mock('./severity_histogram', () => ({
  SeverityHistogram: () => <div data-test-subj="mock-severity-histogram" />,
}));
jest.mock('./log_line', () => ({
  LogLine: ({ row }: { row: any }) => (
    <div data-test-subj="mock-log-line">{JSON.stringify(row)}</div>
  ),
}));
jest.mock('./card_skeleton', () => ({
  CardSkeleton: () => <div data-test-subj="mock-hist-skeleton" />,
  LogLinesSkeleton: () => <div data-test-subj="mock-logs-skeleton" />,
}));

class MockIO {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ isIntersecting: true }]);
  }
  disconnect() {}
}
(global as any).IntersectionObserver = MockIO;

const baseProps = {
  services: {} as any,
  name: 'logs-app-2026.07.09',
  kind: 'index' as const,
  isTimeBased: true,
  rowState: LogRowState.FULL,
  timeFieldName: '@timestamp',
  primaryLabel: 'Create dataset',
  onPrimary: jest.fn(),
  checked: false,
  onToggleCheck: jest.fn(),
  onVisibilityChange: jest.fn(),
  onBrushTime: jest.fn(),
};

const withData = (data: Partial<CardData>): CardData => ({
  loading: false,
  ...data,
});

describe('LogStreamCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports visibility via IntersectionObserver on mount', () => {
    const onVisibilityChange = jest.fn();
    render(
      <LogStreamCard
        {...baseProps}
        rowState={LogRowState.LOADING}
        onVisibilityChange={onVisibilityChange}
        data={withData({ loading: true })}
      />
    );
    expect(onVisibilityChange).toHaveBeenCalledWith(baseProps.name, true);
  });

  it('time-based FULL card renders the severity histogram + log lines', () => {
    render(
      <LogStreamCard
        {...baseProps}
        data={withData({
          histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
          preview: { columns: [], rows: [{ a: 1 }, { b: 2 }] },
        })}
      />
    );
    expect(screen.getByTestId('mock-severity-histogram')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-log-line')).toHaveLength(2);
  });

  it('non-time-based card renders full-width logs with NO histogram', () => {
    render(
      <LogStreamCard
        {...baseProps}
        isTimeBased={false}
        data={withData({ preview: { columns: [], rows: [{ a: 1 }] } })}
      />
    );
    expect(screen.queryByTestId('mock-severity-histogram')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-log-line')).toBeInTheDocument();
  });

  it('the NAME is the primary action (no per-row button)', () => {
    const onPrimary = jest.fn();
    render(
      <LogStreamCard
        {...baseProps}
        onPrimary={onPrimary}
        data={withData({ preview: { columns: [], rows: [] } })}
      />
    );
    // There is no dedicated primary button anymore.
    expect(screen.queryByTestId('logsExploreCardPrimary')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('logsExploreCardNameLink'));
    expect(onPrimary).toHaveBeenCalled();
  });

  it('toggles selection via the checkbox', () => {
    const onToggleCheck = jest.fn();
    render(
      <LogStreamCard
        {...baseProps}
        onToggleCheck={onToggleCheck}
        data={withData({ preview: { columns: [], rows: [] } })}
      />
    );
    fireEvent.click(screen.getByTestId(`logsExploreCardCheckbox-${baseProps.name}`));
    expect(onToggleCheck).toHaveBeenCalled();
  });

  it('shows the histogram + logs skeletons while loading', () => {
    render(
      <LogStreamCard
        {...baseProps}
        rowState={LogRowState.LOADING}
        data={withData({ loading: true })}
      />
    );
    expect(screen.getByTestId('mock-hist-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('mock-logs-skeleton')).toBeInTheDocument();
  });

  it('renders the dataset kind label + name-link action for a dataset card (NO selection checkbox)', () => {
    render(
      <LogStreamCard
        {...baseProps}
        kind="dataset"
        primaryLabel="Query"
        data={withData({ preview: { columns: [], rows: [] } })}
      />
    );
    expect(screen.getByTestId('logsExploreCardNameLink')).toHaveAttribute('title', 'Query');
    expect(screen.getByText('Dataset')).toBeInTheDocument();
    // Datasets are not selectable for batch dataset creation — no checkbox (avoids sharing checked
    // state with a same-named index).
    expect(
      screen.queryByTestId(`logsExploreCardCheckbox-${baseProps.name}`)
    ).not.toBeInTheDocument();
  });

  it('shows the friendly label when provided, falling back to the name (pattern) otherwise', () => {
    const { rerender } = render(
      <LogStreamCard
        {...baseProps}
        kind="dataset"
        name="nginx-access-*"
        label="Nginx access logs"
        primaryLabel="Query"
        data={withData({ preview: { columns: [], rows: [] } })}
      />
    );
    // The friendly label shows, not the raw pattern.
    expect(screen.getByTestId('logsExploreCardNameLink')).toHaveTextContent('Nginx access logs');
    expect(screen.getByTestId('logsExploreCardNameLink')).not.toHaveTextContent('nginx-access-*');
    // No label → falls back to the name (pattern).
    rerender(
      <LogStreamCard
        {...baseProps}
        kind="dataset"
        name="nginx-access-*"
        label={undefined}
        primaryLabel="Query"
        data={withData({ preview: { columns: [], rows: [] } })}
      />
    );
    expect(screen.getByTestId('logsExploreCardNameLink')).toHaveTextContent('nginx-access-*');
  });

  it('shows the cross-cluster (remote) token for a remote index', () => {
    render(
      <LogStreamCard
        {...baseProps}
        isRemote
        data={withData({ preview: { columns: [], rows: [] } })}
      />
    );
    expect(screen.getByText('Index')).toBeInTheDocument();
  });

  // ---- compact variants ----

  it('NO_RECENT: renders the FULL card (meta controls + histogram + empty-logs body) so the time field stays switchable', () => {
    const onPrimary = jest.fn();
    render(
      <LogStreamCard
        {...baseProps}
        rowState={LogRowState.NO_RECENT}
        onPrimary={onPrimary}
        health="green"
        data={withData({
          histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
          preview: { columns: [], rows: [] },
        })}
      />
    );
    // NOT the stripped compact row — the full card renders instead.
    expect(screen.queryByTestId('logsExploreCardNoRecent')).not.toBeInTheDocument();
    // Header meta controls are present: the (read-only) time-field capsule and index health pill.
    expect(screen.getByTestId('logsExploreCardTimeFieldReadonly')).toBeInTheDocument();
    expect(screen.getByTestId(`logsExploreCardHealth-${baseProps.name}`)).toBeInTheDocument();
    // Full body: histogram column + logs region (with the empty "no documents in range" message).
    expect(screen.getByTestId('mock-severity-histogram')).toBeInTheDocument();
    expect(screen.getByTestId('logsExploreCardLogs')).toHaveTextContent(
      'No documents in the selected time range'
    );
    // Name still actionable, checkbox present (this is an index).
    fireEvent.click(screen.getByTestId('logsExploreCardNameLink'));
    expect(onPrimary).toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('NO_RECENT: a DATASET renders the full card with Query/Manage actions and NO checkbox', () => {
    const onManage = jest.fn();
    render(
      <LogStreamCard
        {...baseProps}
        kind="dataset"
        rowState={LogRowState.NO_RECENT}
        onPrimary={jest.fn()}
        onManage={onManage}
        data={withData({
          histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
          preview: { columns: [], rows: [] },
        })}
      />
    );
    // Full card, not the compact row; dataset actions available but no selection checkbox.
    expect(screen.queryByTestId('logsExploreCardNoRecent')).not.toBeInTheDocument();
    expect(screen.getByTestId('logsExploreCardManage')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('EMPTY_INDEX: "No documents yet" + count/age, muted name (no link), no checkbox', () => {
    render(
      <LogStreamCard
        {...baseProps}
        rowState={LogRowState.EMPTY_INDEX}
        docsCount={0}
        createdAt={Date.now() - 3 * 24 * 60 * 60 * 1000}
        onPrimary={undefined}
        data={withData({})}
      />
    );
    const row = screen.getByTestId('logsExploreCardEmptyIndex');
    expect(row).toHaveTextContent('No documents yet');
    expect(row).toHaveTextContent('0 docs');
    expect(screen.queryByTestId('logsExploreCardNameLink')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('ERROR: danger compact row with the error chip + Retry firing onRetry', () => {
    const onRetry = jest.fn();
    render(
      <LogStreamCard
        {...baseProps}
        rowState={LogRowState.ERROR}
        onRetry={onRetry}
        data={withData({ error: 'security_exception · 403' })}
      />
    );
    expect(screen.getByTestId('logsExploreCardError')).toBeInTheDocument();
    expect(screen.getByTestId('logsExploreCardErrorChip')).toHaveTextContent(
      'security_exception · 403'
    );
    fireEvent.click(screen.getByTestId('logsExploreCardRetry'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('ERROR: partial-shard failures use the warning tone', () => {
    render(
      <LogStreamCard
        {...baseProps}
        rowState={LogRowState.ERROR}
        onRetry={jest.fn()}
        data={withData({ error: 'Partial results — 2 of 5 shards failed' })}
      />
    );
    // The row renders; tone class carries the warning variant.
    expect(screen.getByTestId('logsExploreCardError').className).toContain(
      'logsDrilldownCompactRow--warning'
    );
  });

  it('NO_TIME_FIELD: collapsed row, explains why, no body/histogram/checkbox', () => {
    render(
      <LogStreamCard {...baseProps} rowState={LogRowState.NO_TIME_FIELD} data={withData({})} />
    );
    const row = screen.getByTestId('logsExploreCardNoTimeBadge');
    expect(row).toHaveTextContent('No time field');
    expect(screen.queryByTestId('logsExploreCardLogs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-severity-histogram')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  describe('time-field selector', () => {
    const multiDate = ['@timestamp', 'observedTimestamp', 'event.ingested'];

    it('shows a selector when there is more than one date field + a change handler', () => {
      render(
        <LogStreamCard
          {...baseProps}
          dateFields={multiDate}
          onTimeFieldChange={jest.fn()}
          data={withData({
            histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
            preview: { columns: [], rows: [] },
          })}
        />
      );
      const select = screen.getByTestId('logsExploreCardTimeFieldSelect') as HTMLSelectElement;
      expect(select.value).toBe('@timestamp');
      expect(Array.from(select.options).map((o) => o.value)).toEqual(multiDate);
    });

    it('emits onTimeFieldChange with the newly-picked field', () => {
      const onTimeFieldChange = jest.fn();
      render(
        <LogStreamCard
          {...baseProps}
          dateFields={multiDate}
          onTimeFieldChange={onTimeFieldChange}
          data={withData({
            histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
            preview: { columns: [], rows: [] },
          })}
        />
      );
      fireEvent.change(screen.getByTestId('logsExploreCardTimeFieldSelect'), {
        target: { value: 'event.ingested' },
      });
      expect(onTimeFieldChange).toHaveBeenCalledWith('event.ingested');
    });

    it('shows a read-only field (NOT a disabled/greyed select) when there is only one date field', () => {
      render(
        <LogStreamCard
          {...baseProps}
          dateFields={['@timestamp']}
          onTimeFieldChange={jest.fn()}
          data={withData({
            histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
            preview: { columns: [], rows: [] },
          })}
        />
      );
      // No interactive select (nothing to switch), and NOT a greyed-out disabled select — a
      // read-only field with the same clock-prepend look and normal colors.
      expect(screen.queryByTestId('logsExploreCardTimeFieldSelect')).not.toBeInTheDocument();
      const readonly = screen.getByTestId('logsExploreCardTimeFieldReadonly') as HTMLInputElement;
      expect(readonly).toHaveValue('@timestamp');
      expect(readonly).toHaveAttribute('readonly');
      expect(readonly).not.toBeDisabled();
    });

    it('datasets show the read-only time field from their single timeFieldName', () => {
      render(
        <LogStreamCard
          {...baseProps}
          kind="dataset"
          dateFields={undefined}
          onTimeFieldChange={undefined}
          data={withData({
            histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
            preview: { columns: [], rows: [] },
          })}
        />
      );
      expect(screen.queryByTestId('logsExploreCardTimeFieldSelect')).not.toBeInTheDocument();
      const readonly = screen.getByTestId('logsExploreCardTimeFieldReadonly') as HTMLInputElement;
      expect(readonly).toHaveValue('@timestamp');
      expect(readonly).not.toBeDisabled();
    });
  });

  describe('dataset actions + index health', () => {
    it('dataset card shows a Query action (→ onPrimary) and Manage (→ onManage) buttons', () => {
      const onPrimary = jest.fn();
      const onManage = jest.fn();
      render(
        <LogStreamCard
          {...baseProps}
          kind="dataset"
          primaryLabel="Query"
          onPrimary={onPrimary}
          onManage={onManage}
          data={withData({ preview: { columns: [], rows: [] } })}
        />
      );
      const queryBtn = screen.getByTestId('logsExploreCardShowLogs');
      expect(queryBtn).toHaveTextContent('Query');
      fireEvent.click(queryBtn);
      expect(onPrimary).toHaveBeenCalled();
      fireEvent.click(screen.getByTestId('logsExploreCardManage'));
      expect(onManage).toHaveBeenCalled();
    });

    it('index cards do NOT show the dataset Query / Manage buttons', () => {
      render(
        <LogStreamCard
          {...baseProps}
          kind="index"
          onManage={jest.fn()}
          data={withData({ preview: { columns: [], rows: [] } })}
        />
      );
      expect(screen.queryByTestId('logsExploreCardShowLogs')).not.toBeInTheDocument();
      expect(screen.queryByTestId('logsExploreCardManage')).not.toBeInTheDocument();
    });

    it('renders a labeled health pill for an index with cat.indices health', () => {
      render(
        <LogStreamCard
          {...baseProps}
          kind="index"
          health="yellow"
          data={withData({ preview: { columns: [], rows: [] } })}
        />
      );
      const pill = screen.getByTestId(`logsExploreCardHealth-${baseProps.name}`);
      expect(pill).toBeInTheDocument();
      // Shown as a labeled status word (better than a bare dot), tinted per status.
      expect(pill).toHaveTextContent('Degraded');
      expect(pill.className).toContain('logStreamCard__healthPill--yellow');
    });

    it('health pill tooltip shows store size + shard layout from cat.indices on hover', async () => {
      render(
        <LogStreamCard
          {...baseProps}
          kind="index"
          health="green"
          storeSize="2.4gb"
          primaryShards={5}
          replicaCount={1}
          data={withData({ preview: { columns: [], rows: [] } })}
        />
      );
      // EuiToolTip renders its content into the DOM on hover.
      fireEvent.mouseOver(screen.getByTestId(`logsExploreCardHealth-${baseProps.name}`));
      const tip = await screen.findByTestId(`logsExploreCardHealthTip-${baseProps.name}`);
      // The tooltip shows the RAW cat.indices health status as-is (not the pill's "Healthy" label).
      expect(tip).toHaveTextContent('Status: green');
      expect(tip).not.toHaveTextContent('Healthy');
      expect(tip).toHaveTextContent('Store size: 2.4gb');
      expect(tip).toHaveTextContent('Primaries: 5');
      expect(tip).toHaveTextContent('Replicas: 1');
    });

    it('shows no health pill when health is unknown, or for a dataset card', () => {
      const { rerender } = render(
        <LogStreamCard
          {...baseProps}
          kind="index"
          health={undefined}
          data={withData({ preview: { columns: [], rows: [] } })}
        />
      );
      expect(
        screen.queryByTestId(`logsExploreCardHealth-${baseProps.name}`)
      ).not.toBeInTheDocument();
      rerender(
        <LogStreamCard
          {...baseProps}
          kind="dataset"
          health="green"
          data={withData({ preview: { columns: [], rows: [] } })}
        />
      );
      expect(
        screen.queryByTestId(`logsExploreCardHealth-${baseProps.name}`)
      ).not.toBeInTheDocument();
    });
  });
});
