/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatternsTableFlyout, PatternsFlyoutRecord } from './patterns_table_flyout';
import * as patternsFlyoutContext from './patterns_flyout_context';

jest.mock('./patterns_flyout_context', () => ({
  usePatternsFlyoutContext: jest.fn(),
}));

jest.mock('./patterns_flyout_update_search', () => ({
  PatternsFlyoutUpdateSearch: ({ patternString }: { patternString: string }) => (
    <div data-test-subj="mock-update-search">Update Search: {patternString}</div>
  ),
}));

jest.mock('./patterns_flyout_event_table', () => ({
  PatternsFlyoutEventTable: ({
    patternString,
    totalItemCount,
  }: {
    patternString: string;
    totalItemCount: number;
  }) => (
    <table data-testid="mock-event-table">
      <tbody>
        <tr>
          <td>Event</td>
          <td>Sample Event</td>
        </tr>
      </tbody>
    </table>
  ),
}));

describe('PatternsTableFlyout', () => {
  const mockClosePatternsTableFlyout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with pattern data', () => {
    const mockRecord: PatternsFlyoutRecord = {
      pattern: 'INFO [main] * application',
      count: 350,
      sample: ['INFO [main] Starting application', 'INFO [main] Stopping application'],
    };

    jest.spyOn(patternsFlyoutContext, 'usePatternsFlyoutContext').mockReturnValue({
      patternsFlyoutData: mockRecord,
      closePatternsTableFlyout: mockClosePatternsTableFlyout,
      isFlyoutOpen: true,
      openPatternsTableFlyout: jest.fn(),
    });

    const { container } = render(<PatternsTableFlyout />);

    expect(screen.getByText('Inspect pattern')).toBeInTheDocument();

    expect(screen.getByText('Pattern')).toBeInTheDocument();
    expect(screen.getByText('INFO [main] * application')).toBeInTheDocument();

    // Event count is shown in the events panel title
    expect(screen.getByText('Events (350)')).toBeInTheDocument();

    // Update search button should be in the header
    expect(screen.getByTestId('mock-update-search')).toBeInTheDocument();

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should render error message when no pattern data is available', () => {
    jest.spyOn(patternsFlyoutContext, 'usePatternsFlyoutContext').mockReturnValue({
      patternsFlyoutData: undefined,
      closePatternsTableFlyout: mockClosePatternsTableFlyout,
      isFlyoutOpen: true,
      openPatternsTableFlyout: jest.fn(),
    });

    render(<PatternsTableFlyout />);

    // checking if error callout is in document
    expect(screen.getByText('No pattern data available for this row')).toBeInTheDocument();

    // checking that other panels aren't in document
    expect(screen.queryByText('Pattern')).not.toBeInTheDocument();

    // Update search should not be rendered when there's no record
    expect(screen.queryByTestId('mock-update-search')).not.toBeInTheDocument();
  });

  it('should handle empty sample array', () => {
    const mockRecord: PatternsFlyoutRecord = {
      pattern: 'ERROR [database] * connection',
      count: 50,
      sample: [],
    };

    jest.spyOn(patternsFlyoutContext, 'usePatternsFlyoutContext').mockReturnValue({
      patternsFlyoutData: mockRecord,
      closePatternsTableFlyout: mockClosePatternsTableFlyout,
      isFlyoutOpen: true,
      openPatternsTableFlyout: jest.fn(),
    });

    render(<PatternsTableFlyout />);

    expect(screen.getByText('Pattern')).toBeInTheDocument();
    expect(screen.getByText('ERROR [database] * connection')).toBeInTheDocument();

    expect(screen.getByText('Events (50)')).toBeInTheDocument();
  });

  it('should call closePatternsTableFlyout when close button is clicked', async () => {
    const user = userEvent.setup();

    const mockRecord: PatternsFlyoutRecord = {
      pattern: 'INFO [main] * application',
      count: 350,
      sample: ['INFO [main] Starting application'],
    };

    jest.spyOn(patternsFlyoutContext, 'usePatternsFlyoutContext').mockReturnValue({
      patternsFlyoutData: mockRecord,
      closePatternsTableFlyout: mockClosePatternsTableFlyout,
      isFlyoutOpen: true,
      openPatternsTableFlyout: jest.fn(),
    });

    const { container } = render(<PatternsTableFlyout />);

    const closeButton = container.querySelector(
      '[data-test-subj="euiFlyoutCloseButton"]'
    ) as HTMLButtonElement;
    expect(closeButton).not.toBeNull();
    await user.click(closeButton);

    // checking if closePatternsTableFlyout was called
    expect(mockClosePatternsTableFlyout).toHaveBeenCalledTimes(1);
  });
});
