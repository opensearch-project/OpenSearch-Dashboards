/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ResultsSummaryButton, FeedbackStatus } from './results_summary_button';

describe('ResultsSummary', () => {
  const defaultProps = {
    actionButtonVisible: true,
    feedback: FeedbackStatus.NONE,
    onFeedback: jest.fn(),
    summary: 'Test summary content',
    loading: false,
    onGenerateSummary: jest.fn(),
    sampleSize: 10,
    isPopoverOpen: false,
    setIsPopoverOpen: jest.fn(),
    generateError: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render component with basic elements', () => {
    render(<ResultsSummaryButton {...defaultProps} summary="" />);
    expect(screen.getByRole('button', { name: 'Generate Summary' })).toBeInTheDocument();
  });

  it('should show popover when opened', () => {
    render(<ResultsSummaryButton {...defaultProps} isPopoverOpen={true} />);
    expect(screen.getByText('SUMMARY')).toBeInTheDocument();
    expect(screen.getByText('Test summary content')).toBeInTheDocument();
  });

  it('should handle feedback interactions when popover is open', () => {
    const { rerender } = render(<ResultsSummaryButton {...defaultProps} isPopoverOpen={true} />);

    expect(screen.getByTestId('exploreResultsSummary_summary_buttons_thumbup')).toBeInTheDocument();
    expect(
      screen.getByTestId('exploreResultsSummary_summary_buttons_thumbdown')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('exploreResultsSummary_summary_buttons_thumbup'));
    expect(defaultProps.onFeedback).toHaveBeenCalledWith(true);

    rerender(
      <ResultsSummaryButton
        {...defaultProps}
        isPopoverOpen={true}
        feedback={FeedbackStatus.THUMB_UP}
      />
    );
    expect(screen.getByTestId('exploreResultsSummary_summary_buttons_thumbup')).toBeInTheDocument();
    expect(
      screen.queryByTestId('exploreResultsSummary_summary_buttons_thumbdown')
    ).not.toBeInTheDocument();
  });

  it('should handle button click and loading states', () => {
    const { rerender } = render(<ResultsSummaryButton {...defaultProps} summary="" />);

    const generateButton = screen.getByRole('button', { name: 'Generate Summary' });
    fireEvent.click(generateButton);
    expect(defaultProps.setIsPopoverOpen).toHaveBeenCalledWith(true);
    expect(defaultProps.onGenerateSummary).toHaveBeenCalled();

    rerender(<ResultsSummaryButton {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: 'Generating...' })).toBeInTheDocument();
  });
});
