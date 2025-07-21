/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ResultsSummary, FeedbackStatus } from './results_summary';

describe('ResultsSummary', () => {
  const defaultProps = {
    accordionState: 'open' as const,
    onClickAccordion: jest.fn(),
    actionButtonVisible: true,
    feedback: FeedbackStatus.NONE,
    afterFeedbackTip: 'Thank you for your feedback',
    onFeedback: jest.fn(),
    summary: 'Test summary content',
    canGenerateSummary: true,
    loading: false,
    onGenerateSummary: jest.fn(),
    sampleSize: 10,
    getPanelMessage: jest.fn(() => <div>Panel message</div>),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render component with basic elements', () => {
    render(<ResultsSummary {...defaultProps} />);
    expect(screen.getByTestId('exploreResultsSummary')).toBeInTheDocument();
    expect(screen.getByText('Results summary')).toBeInTheDocument();
    expect(screen.getByLabelText('Summary based on first 10 records')).toBeInTheDocument();
    expect(screen.getByText('Panel message')).toBeInTheDocument();
  });

  it('should handle accordion state and actions visibility', () => {
    const { rerender } = render(<ResultsSummary {...defaultProps} />);

    expect(screen.getByTestId('exploreResultsSummary_accordion_actions')).toBeInTheDocument();

    rerender(<ResultsSummary {...defaultProps} accordionState="closed" />);
    expect(screen.queryByTestId('exploreResultsSummary_accordion_actions')).not.toBeInTheDocument();

    rerender(<ResultsSummary {...defaultProps} actionButtonVisible={false} />);
    expect(screen.queryByText('Was this helpful?')).not.toBeInTheDocument();
  });

  it('should handle feedback interactions', () => {
    const { rerender } = render(<ResultsSummary {...defaultProps} />);

    expect(screen.getByTestId('exploreResultsSummary_summary_buttons_thumbup')).toBeInTheDocument();
    expect(
      screen.getByTestId('exploreResultsSummary_summary_buttons_thumbdown')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('exploreResultsSummary_summary_buttons_thumbup'));
    expect(defaultProps.onFeedback).toHaveBeenCalledWith(true);

    rerender(<ResultsSummary {...defaultProps} feedback={FeedbackStatus.THUMB_UP} />);
    expect(screen.getByTestId('exploreResultsSummary_summary_buttons_thumbup')).toBeInTheDocument();
    expect(
      screen.queryByTestId('exploreResultsSummary_summary_buttons_thumbdown')
    ).not.toBeInTheDocument();
  });

  it('should handle generate summary button states', () => {
    const { rerender } = render(<ResultsSummary {...defaultProps} />);

    const generateButton = screen.getByTestId('exploreResultsSummary_summary_buttons_generate');
    fireEvent.click(generateButton);
    expect(defaultProps.onGenerateSummary).toHaveBeenCalled();

    rerender(<ResultsSummary {...defaultProps} canGenerateSummary={false} />);
    expect(screen.getByTestId('exploreResultsSummary_summary_buttons_generate')).toBeDisabled();

    rerender(<ResultsSummary {...defaultProps} loading={true} />);
    const loadingButton = screen.getByTestId('exploreResultsSummary_summary_buttons_generate');
    expect(loadingButton).toBeInTheDocument();
  });
});
