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

    expect(screen.getByText('Event count')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();

    expect(screen.getByText('Events (350)')).toBeInTheDocument();

    expect(screen.getAllByText('Event')[0]).toBeInTheDocument(); // getAllByText because there are multiple elements
    expect(screen.getByText('INFO [main] Starting application')).toBeInTheDocument();
    expect(screen.getByText('INFO [main] Stopping application')).toBeInTheDocument();

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
    expect(screen.queryByText('Event count')).not.toBeInTheDocument();
    expect(screen.queryByText('Events')).not.toBeInTheDocument();
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

    const { container } = render(<PatternsTableFlyout />);

    expect(screen.getByText('Pattern')).toBeInTheDocument();
    expect(screen.getByText('ERROR [database] * connection')).toBeInTheDocument();

    expect(screen.getByText('Event count')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    expect(screen.getByText('Events (50)')).toBeInTheDocument();

    // checking if there is no table in document
    const table = container.querySelector('table');
    expect(table).not.toBeInTheDocument();
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
