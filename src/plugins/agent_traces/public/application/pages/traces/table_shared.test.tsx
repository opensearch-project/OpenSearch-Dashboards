/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import {
  PPL_SORT_FIELDS,
  buildPplSortClause,
  splitPplWhereAndTail,
  queryEndsWithHead,
  TableLoadingState,
  TableEmptyState,
} from './table_shared';

describe('table_shared', () => {
  describe('PPL_SORT_FIELDS', () => {
    it('maps UI fields to PPL fields', () => {
      expect(PPL_SORT_FIELDS.startTime).toBe('startTime');
      expect(PPL_SORT_FIELDS.kind).toBe('`attributes.gen_ai.operation.name`');
      expect(PPL_SORT_FIELDS.latency).toBe('durationInNanos');
      expect(PPL_SORT_FIELDS.name).toBe('name');
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
      // Note: where after stats gets grouped with other where clauses
      expect(result.whereQuery).toBe('source=idx | where a=1 | where count > 5');
      expect(result.tailCommands).toBe('| stats count()');
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
        <IntlProvider locale="en">
          <TableEmptyState title="No traces found" />
        </IntlProvider>
      );
      expect(screen.getByText('No traces found')).toBeInTheDocument();
      expect(screen.getByText('otel-v1-apm-span-*')).toBeInTheDocument();
      expect(screen.getByText('gen_ai.operation.name')).toBeInTheDocument();
    });
  });
});
