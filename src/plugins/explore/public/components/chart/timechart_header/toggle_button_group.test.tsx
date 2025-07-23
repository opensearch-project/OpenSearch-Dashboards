/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleButtonGroup } from './toggle_button_group';
import { DiscoverChartToggleId } from '../utils/use_persist_chart_state';

// Mock i18n
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (id: string, { defaultMessage }: { defaultMessage: string }) => defaultMessage,
  },
}));

describe('ToggleButtonGroup', () => {
  const defaultProps = {
    isSummaryAvailable: true,
    toggleIdSelected: 'histogram' as DiscoverChartToggleId,
    onToggleChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders toggle buttons when summary is available', () => {
    render(<ToggleButtonGroup {...defaultProps} />);

    expect(screen.getByText('View as')).toBeInTheDocument();
    expect(screen.getByText('Histogram')).toBeInTheDocument();
    expect(screen.getByText('AI Summary')).toBeInTheDocument();
  });

  it('does not render when summary is not available', () => {
    const { container } = render(
      <ToggleButtonGroup {...defaultProps} isSummaryAvailable={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onToggleChange when a button is clicked', () => {
    render(<ToggleButtonGroup {...defaultProps} />);

    // Find and click the AI Summary button
    const summaryButton = screen.getByText('AI Summary');
    fireEvent.click(summaryButton);

    expect(defaultProps.onToggleChange).toHaveBeenCalledWith('summary');
  });
});
