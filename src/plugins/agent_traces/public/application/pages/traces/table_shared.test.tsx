/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import {
  PPL_SORT_FIELDS,
  buildPplSortClause,
  splitPplWhereAndTail,
  queryEndsWithHead,
  TableLoadingState,
  TableEmptyState,
  hitToBaseRow,
  DataTableInfoBar,
} from './table_shared';

describe('table_shared', () => {
  describe('PPL_SORT_FIELDS', () => {
    it('maps UI fields to PPL fields', () => {
      expect(PPL_SORT_FIELDS.kind).toBe('`attributes.gen_ai.operation.name`');
      expect(PPL_SORT_FIELDS.latency).toBe('durationInNanos');
      expect(PPL_SORT_FIELDS.status).toBe('`status.code`');
    });
  });

  describe('buildPplSortClause', () => {
    it('builds descending sort clause', () => {
      expect(buildPplSortClause('startTime', 'desc')).toBe('| sort - startTime');
    });

    it('builds ascending sort clause', () => {
      expect(buildPplSortClause('startTime', 'asc')).toBe('| sort startTime');
    });

    it('maps latency field to durationInNanos', () => {
      expect(buildPplSortClause('latency', 'desc')).toBe('| sort - durationInNanos');
    });

    it('maps kind field to gen_ai.operation.name', () => {
      expect(buildPplSortClause('kind', 'asc')).toBe('| sort `attributes.gen_ai.operation.name`');
    });

    it('passes through unknown simple fields as-is', () => {
      expect(buildPplSortClause('unknownField', 'desc')).toBe('| sort - unknownField');
    });

    it('wraps dotted field names in backticks', () => {
      expect(buildPplSortClause('resource.attributes.service.name', 'asc')).toBe(
        '| sort `resource.attributes.service.name`'
      );
    });
  });

  describe('splitPplWhereAndTail', () => {
    it('splits source and where from tail commands', () => {
      const result = splitPplWhereAndTail('source=idx | where a=1 | sort startTime | head 100');
      expect(result.whereQuery).toBe('source=idx | where a=1');
      expect(result.tailCommands).toBe('| sort startTime | head 100');
    });

    it('returns only whereQuery when no tail commands', () => {
      const result = splitPplWhereAndTail('source=idx | where status=200');
      expect(result.whereQuery).toBe('source=idx | where status=200');
      expect(result.tailCommands).toBe('');
    });

    it('handles source-only query', () => {
      const result = splitPplWhereAndTail('source=otel-v1-apm-span-*');
      expect(result.whereQuery).toBe('source=otel-v1-apm-span-*');
      expect(result.tailCommands).toBe('');
    });

    it('handles multiple where clauses', () => {
      const result = splitPplWhereAndTail('source=idx | where a=1 | where b=2 | head 10');
      expect(result.whereQuery).toBe('source=idx | where a=1 | where b=2');
      expect(result.tailCommands).toBe('| head 10');
    });

    it('handles tail-only commands (no source/where)', () => {
      const result = splitPplWhereAndTail('head 10');
      expect(result.whereQuery).toBe('');
      expect(result.tailCommands).toBe('| head 10');
    });

    it('returns empty strings for empty input', () => {
      const result = splitPplWhereAndTail('');
      expect(result.whereQuery).toBe('');
      expect(result.tailCommands).toBe('');
    });

    it('handles mixed where and non-where commands', () => {
      const result = splitPplWhereAndTail(
        'source=idx | where a=1 | stats count() | where count > 5'
      );
      // Once a non-where command is encountered, all subsequent parts stay as tail
      expect(result.whereQuery).toBe('source=idx | where a=1');
      expect(result.tailCommands).toBe('| stats count() | where count > 5');
    });

    it('handles dedup and eval as tail commands', () => {
      const result = splitPplWhereAndTail('source=idx | where a=1 | dedup name | eval x = a + b');
      expect(result.whereQuery).toBe('source=idx | where a=1');
      expect(result.tailCommands).toBe('| dedup name | eval x = a + b');
    });
  });

  describe('queryEndsWithHead', () => {
    it('detects simple head at end', () => {
      expect(queryEndsWithHead('source=idx | head')).toBe(true);
    });

    it('detects head with count', () => {
      expect(queryEndsWithHead('source=idx | head 100')).toBe(true);
    });

    it('detects head with from offset', () => {
      expect(queryEndsWithHead('source=idx | head 100 from 50')).toBe(true);
    });

    it('detects head followed by where', () => {
      expect(queryEndsWithHead('source=idx | head 100 | where a=1')).toBe(true);
    });

    it('returns false when head is not at end', () => {
      expect(queryEndsWithHead('source=idx | head 100 | sort name')).toBe(false);
    });

    it('returns false when no head present', () => {
      expect(queryEndsWithHead('source=idx | where a=1')).toBe(false);
    });

    it('ignores head inside subquery brackets', () => {
      expect(queryEndsWithHead('source=idx | where a IN [source=idx2 | head 10] | sort name')).toBe(
        false
      );
    });

    it('detects head at end even with subquery present', () => {
      expect(queryEndsWithHead('source=idx | where a IN [source=idx2 | where b=1] | head 50')).toBe(
        true
      );
    });

    it('is case-insensitive', () => {
      expect(queryEndsWithHead('source=idx | HEAD 10')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(queryEndsWithHead('')).toBe(false);
    });
  });

  describe('TableLoadingState', () => {
    it('renders loading spinner with message', () => {
      render(<TableLoadingState message="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('TableEmptyState', () => {
    it('renders empty state with title and instrumentation guidance', () => {
      render(
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        <IntlProvider locale="en">
          <TableEmptyState title="No traces found" />
        </IntlProvider>
      );
      expect(screen.getByText('No traces found')).toBeInTheDocument();
      expect(screen.getByText('gen_ai.operation.name')).toBeInTheDocument();
    });
  });

  describe('hitToBaseRow', () => {
    const formatTs = (ts: string) => ts;

    const makeHit = (overrides: Record<string, any> = {}) => ({
      _index: 'otel-v1-apm-span-000001',
      _id: 'hit-1',
      _score: null,
      _source: {
        spanId: 'span-abc',
        traceId: 'trace-123',
        parentSpanId: '',
        name: 'test-span',
        startTime: '2025-01-01T00:00:00Z',
        endTime: '2025-01-01T00:00:01Z',
        durationInNanos: 1000000000,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'status.code': 0,
        ...overrides,
      },
    });

    it('converts a hit to a BaseRow with level 0', () => {
      const row = hitToBaseRow(makeHit(), formatTs);
      expect(row.level).toBe(0);
      expect(row.spanId).toBe('span-abc');
      expect(row.traceId).toBe('trace-123');
    });

    it('sets isExpandable to false by default (no markExpandable)', () => {
      const row = hitToBaseRow(makeHit(), formatTs);
      expect(row.isExpandable).toBe(false);
    });

    it('sets isExpandable to false when markExpandable is false', () => {
      const row = hitToBaseRow(makeHit(), formatTs, { markExpandable: false });
      expect(row.isExpandable).toBe(false);
    });

    it('marks root spans as expandable when markExpandable is true', () => {
      const row = hitToBaseRow(makeHit({ parentSpanId: '' }), formatTs, { markExpandable: true });
      expect(row.isExpandable).toBe(true);
    });

    it('does not mark child spans as expandable when markExpandable is true', () => {
      const row = hitToBaseRow(makeHit({ parentSpanId: 'parent-123' }), formatTs, {
        markExpandable: true,
      });
      expect(row.isExpandable).toBe(false);
    });

    it('handles missing _source gracefully', () => {
      const hit = { _index: '', _id: 'x', _score: null, _source: undefined as any };
      const row = hitToBaseRow(hit, formatTs);
      expect(row.level).toBe(0);
      expect(row.isExpandable).toBe(false);
    });
  });

  describe('DataTableInfoBar', () => {
    const defaultProps = {
      hasHead: false,
      hitsCount: 50,
      totalCount: 200,
      elapsedMs: 123,
      entityName: 'span' as const,
      wrapCellText: false,
      onWrapCellTextChange: jest.fn(),
    };

    it('renders count with total for spans', () => {
      render(
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        <IntlProvider locale="en">
          <DataTableInfoBar {...defaultProps} />
        </IntlProvider>
      );
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('renders count without total when hasHead is true', () => {
      render(
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        <IntlProvider locale="en">
          <DataTableInfoBar {...defaultProps} hasHead={true} />
        </IntlProvider>
      );
      expect(screen.getByText('50')).toBeInTheDocument();
      // Total should not be rendered when hasHead is true
      expect(screen.queryByText('200')).not.toBeInTheDocument();
    });

    it('renders trace entity name', () => {
      render(
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        <IntlProvider locale="en">
          <DataTableInfoBar {...defaultProps} entityName="trace" />
        </IntlProvider>
      );
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('renders em dash when elapsedMs is undefined', () => {
      render(
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        <IntlProvider locale="en">
          <DataTableInfoBar {...defaultProps} elapsedMs={undefined} />
        </IntlProvider>
      );
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('toggles wrap cell text switch', () => {
      const onWrapChange = jest.fn();
      render(
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        <IntlProvider locale="en">
          <DataTableInfoBar {...defaultProps} onWrapCellTextChange={onWrapChange} />
        </IntlProvider>
      );
      const switchEl = screen.getByTestId('agentTracesWrapCellTextSwitch');
      fireEvent.click(switchEl);
      expect(onWrapChange).toHaveBeenCalledWith(true);
    });
  });
});
