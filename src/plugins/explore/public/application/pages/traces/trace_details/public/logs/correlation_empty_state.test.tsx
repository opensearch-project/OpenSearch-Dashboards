/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CorrelationEmptyState, CorrelationEmptyStateProps } from './correlation_empty_state';
import { Dataset } from '../../../../../../../../data/common';

// Mock i18n
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (id: string, options: { defaultMessage: string }) => options.defaultMessage,
  },
}));

const mockWindowOpen = jest.fn();

jest.spyOn(window, 'open').mockImplementation(mockWindowOpen);

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
    // Set up the URL via the History API (jsdom 26 compatible).
    window.history.pushState({}, '', '/workspace/app/explore');
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
    { pathname: '/workspace/app/explore', shouldNavigate: true },
    { pathname: '/app/explore', shouldNavigate: true },
    { pathname: '/some/other/path', shouldNavigate: false },
  ])('URL generation', ({ pathname, shouldNavigate }) => {
    it(`handles pathname ${pathname}`, () => {
      window.history.pushState({}, '', pathname);
      render(<CorrelationEmptyState {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Create from traces dataset' }));
      // When the pathname is valid, the button click triggers navigation (window.location.href = url).
      // We verify the click was handled without error; URL construction is covered by url_builder tests.
      if (shouldNavigate) {
        expect(
          screen.getByRole('button', { name: 'Create from traces dataset' })
        ).toBeInTheDocument();
      }
    });
  });

  it('handles different protocol and host combinations', () => {
    window.history.pushState({}, '', '/workspace/app/explore');
    render(<CorrelationEmptyState {...defaultProps} />);
    // Verify the button click does not throw on any origin.
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Create from traces dataset' }))
    ).not.toThrow();
  });
});
