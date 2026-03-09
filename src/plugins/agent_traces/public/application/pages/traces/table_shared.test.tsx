/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  PPL_SORT_FIELDS,
  DEFAULT_SORT,
  buildPplSortClause,
  renderStatus,
  TableLoadingState,
  TableErrorState,
} from './table_shared';

describe('table_shared', () => {
  describe('constants', () => {
    it('exports page size options', () => {
      expect(PAGE_SIZE_OPTIONS).toEqual([10, 25, 50]);
    });

    it('exports default page size', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(50);
    });
  });

  describe('renderStatus', () => {
    it('renders Success for success status', () => {
      const { container } = render(<>{renderStatus('success')}</>);
      expect(container.textContent).toContain('Success');
    });

    it('renders Error for non-success status', () => {
      const { container } = render(<>{renderStatus('error')}</>);
      expect(container.textContent).toContain('Error');
    });
  });

  describe('TableLoadingState', () => {
    it('renders loading spinner with message', () => {
      render(<TableLoadingState message="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('TableErrorState', () => {
    it('renders error with retry button', () => {
      const onRetry = jest.fn();
      render(
        <TableErrorState
          title="Error"
          error="Something went wrong"
          onRetry={onRetry}
          retryLabel="Retry"
        />
      );
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('DEFAULT_SORT', () => {
    it('defaults to startTime descending', () => {
      expect(DEFAULT_SORT).toEqual({ field: 'startTime', direction: 'desc' });
    });
  });

  describe('PPL_SORT_FIELDS', () => {
    it('maps UI fields to PPL fields', () => {
      expect(PPL_SORT_FIELDS.startTime).toBe('startTime');
      expect(PPL_SORT_FIELDS.latency).toBe('durationInNanos');
      expect(PPL_SORT_FIELDS.totalTokens).toBe('`attributes.gen_ai.usage.output_tokens`');
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

    it('maps totalTokens to output_tokens field', () => {
      expect(buildPplSortClause('totalTokens', 'asc')).toBe(
        '| sort `attributes.gen_ai.usage.output_tokens`'
      );
    });

    it('falls back to startTime for unknown fields', () => {
      expect(buildPplSortClause('unknownField', 'desc')).toBe('| sort - startTime');
    });
  });
});
