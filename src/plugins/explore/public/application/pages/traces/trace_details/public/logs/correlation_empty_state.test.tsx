/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CorrelationEmptyState, CorrelationEmptyStateProps } from './correlation_empty_state';
import { Dataset } from '../../../../../../../../data/common';

// Mock i18n
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (id: string, options: { defaultMessage: string }) => options.defaultMessage,
  },
}));

// Mock window.location and window.open
const mockWindowLocation = {
  protocol: 'https:',
  host: 'localhost:5601',
  pathname: '/workspace/app/explore',
  href: '',
};

const mockWindowOpen = jest.fn();

Object.defineProperty(window, 'location', {
  value: mockWindowLocation,
  writable: true,
});

Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('CorrelationEmptyState', () => {
  const mockDataset: Dataset = {
    id: 'test-dataset-id',
    title: 'Test Dataset',
    type: 'INDEX_PATTERN',
    timeFieldName: '@timestamp',
  };

  const defaultProps: CorrelationEmptyStateProps = {
    traceDataset: mockDataset,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowLocation.href = '';
    mockWindowLocation.pathname = '/workspace/app/explore';
    mockWindowLocation.protocol = 'https:';
    mockWindowLocation.host = 'localhost:5601';
  });

  it('renders empty state with correct content', () => {
    render(<CorrelationEmptyState {...defaultProps} />);

    expect(screen.getByText('Correlation not configured')).toBeInTheDocument();
    expect(
      screen.getByText('To view related logs, create a trace correlation with log data.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create from traces dataset' })).not.toBeDisabled();
  });

  describe.each([
    { traceDataset: undefined, description: 'undefined dataset' },
    { traceDataset: { id: undefined }, description: 'undefined id' },
    { traceDataset: { id: null }, description: 'null id' },
    { traceDataset: { id: '' }, description: 'empty string id' },
  ])('Button disabled states', ({ traceDataset, description }) => {
    it(`disables button when ${description}`, () => {
      render(<CorrelationEmptyState traceDataset={traceDataset as any} />);

      expect(screen.getByRole('button', { name: 'Create from traces dataset' })).toBeDisabled();
    });
  });

  describe.each([
    {
      pathname: '/workspace/app/explore',
      expected:
        'https://localhost:5601/workspace/app/datasets/patterns/test-dataset-id#/?_a=(tab:correlatedDatasets)',
    },
    {
      pathname: '/app/explore',
      expected:
        'https://localhost:5601/app/datasets/patterns/test-dataset-id#/?_a=(tab:correlatedDatasets)',
    },
    {
      pathname: '/some/other/path',
      expected: '',
    },
  ])('URL generation', ({ pathname, expected }) => {
    it(`handles pathname ${pathname}`, () => {
      mockWindowLocation.pathname = pathname;
      render(<CorrelationEmptyState {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Create from traces dataset' }));
      expect(mockWindowLocation.href).toBe(expected);
    });
  });

  it('handles different protocol and host combinations', () => {
    mockWindowLocation.protocol = 'http:';
    mockWindowLocation.host = 'example.com:8080';

    render(<CorrelationEmptyState {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create from traces dataset' }));

    expect(mockWindowLocation.href).toBe(
      'http://example.com:8080/workspace/app/datasets/patterns/test-dataset-id#/?_a=(tab:correlatedDatasets)'
    );
  });
});
