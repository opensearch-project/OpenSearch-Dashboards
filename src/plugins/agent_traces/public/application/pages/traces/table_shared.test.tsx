/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
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
});
