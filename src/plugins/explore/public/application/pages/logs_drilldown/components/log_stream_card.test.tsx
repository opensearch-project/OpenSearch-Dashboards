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
  rangeLabel: '15 minutes',
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

  it('NO_RECENT: compact row with "No events in the last {range}" + actionable name + checkbox', () => {
    const onPrimary = jest.fn();
    render(
      <LogStreamCard
        {...baseProps}
        rowState={LogRowState.NO_RECENT}
        onPrimary={onPrimary}
        data={withData({
          histogram: { series: [], intervalMs: 60000, from: 0, to: 60000, totals: [] },
          preview: { columns: [], rows: [] },
        })}
      />
    );
    const row = screen.getByTestId('logsExploreCardNoRecent');
    expect(row).toHaveTextContent('No events in the last 15 minutes');
    // No full body.
    expect(screen.queryByTestId('logsExploreCardLogs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-severity-histogram')).not.toBeInTheDocument();
    // Name still actionable, checkbox present.
    fireEvent.click(screen.getByTestId('logsExploreCardNameLink'));
    expect(onPrimary).toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
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

    it('shows the SAME selector — disabled — when there is only one date field (uniform UI)', () => {
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
      // Same widget as the multi-field case (no separate read-only badge), but non-interactive.
      const select = screen.getByTestId('logsExploreCardTimeFieldSelect') as HTMLSelectElement;
      expect(select).toBeDisabled();
      expect(select.value).toBe('@timestamp');
      expect(Array.from(select.options).map((o) => o.value)).toEqual(['@timestamp']);
    });

    it('datasets show the uniform (disabled) time selector from their single timeFieldName', () => {
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
      const select = screen.getByTestId('logsExploreCardTimeFieldSelect') as HTMLSelectElement;
      expect(select).toBeDisabled();
      expect(select.value).toBe('@timestamp');
    });
  });

  describe('dataset actions + index health', () => {
    it('dataset card shows Show logs (→ onPrimary) and Manage (→ onManage) buttons', () => {
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
      fireEvent.click(screen.getByTestId('logsExploreCardShowLogs'));
      expect(onPrimary).toHaveBeenCalled();
      fireEvent.click(screen.getByTestId('logsExploreCardManage'));
      expect(onManage).toHaveBeenCalled();
    });

    it('index cards do NOT show the dataset Show logs / Manage buttons', () => {
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

    it('renders a health dot for an index with cat.indices health', () => {
      render(
        <LogStreamCard
          {...baseProps}
          kind="index"
          health="yellow"
          data={withData({ preview: { columns: [], rows: [] } })}
        />
      );
      expect(screen.getByTestId(`logsExploreCardHealth-${baseProps.name}`)).toBeInTheDocument();
    });

    it('shows no health dot when health is unknown, or for a dataset card', () => {
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
