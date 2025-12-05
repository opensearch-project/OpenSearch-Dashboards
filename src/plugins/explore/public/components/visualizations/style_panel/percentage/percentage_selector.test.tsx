/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PercentageSelector } from './percentage_selector';
import { PercentageColor } from '../../types';

describe('PercentageSelector', () => {
  const mockOnShowPercentageToggle = jest.fn();
  const mockOnPercentageColorChange = jest.fn();

  const defaultProps = {
    showPercentage: false,
    percentageColor: 'standard' as PercentageColor,
    onShowPercentageToggle: mockOnShowPercentageToggle,
    onPercentageColorChange: mockOnPercentageColorChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<PercentageSelector {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders the switch with correct label', () => {
    render(<PercentageSelector {...defaultProps} />);
    expect(screen.getByText('Show percentage')).toBeInTheDocument();
  });

  it('renders switch in unchecked state when showPercentage is false', () => {
    render(<PercentageSelector {...defaultProps} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
  });

  it('renders switch in checked state when showPercentage is true', () => {
    render(<PercentageSelector {...{ ...defaultProps, showPercentage: true }} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });

  it('does not render percentage color selector when showPercentage is false', () => {
    render(<PercentageSelector {...defaultProps} />);
    expect(screen.queryByText('Percentage color')).not.toBeInTheDocument();
  });

  it('renders percentage color selector when showPercentage is true', () => {
    render(<PercentageSelector {...{ ...defaultProps, showPercentage: true }} />);
    expect(screen.getByText('Percentage color')).toBeInTheDocument();
  });

  it('calls onShowPercentageToggle when switch is clicked', () => {
    render(<PercentageSelector {...defaultProps} />);
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    expect(mockOnShowPercentageToggle).toHaveBeenCalledWith(true);
  });

  it('displays the correct percentage color options', async () => {
    render(<PercentageSelector {...{ ...defaultProps, showPercentage: true }} />);

    // Open the dropdown
    const select = screen.getByTestId('percentageColorSelector');
    fireEvent.click(select);

    // Check that both options are available
    await waitFor(() => {
      expect(screen.getByText('Standard')).toBeInTheDocument();
      expect(screen.getByText('Inverted')).toBeInTheDocument();
    });
  });

  it('selects the correct percentage color option based on props', () => {
    render(
      <PercentageSelector
        {...{ ...defaultProps, showPercentage: true, percentageColor: 'inverted' }}
      />
    );
    expect(screen.getByDisplayValue('Inverted')).toBeInTheDocument();
  });

  it('calls onPercentageColorChange when a different color is selected', () => {
    render(<PercentageSelector {...{ ...defaultProps, showPercentage: true }} />);

    // Select a different option
    const select = screen.getByTestId('percentageColorSelector');
    fireEvent.change(select, { target: { value: 'inverted' } });

    expect(mockOnPercentageColorChange).toHaveBeenCalledWith('inverted');
  });

  it('handles null showPercentage value by defaulting to false', () => {
    // @ts-ignore - Testing null value handling
    render(<PercentageSelector {...{ ...defaultProps, showPercentage: null }} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
  });

  it('handles undefined showPercentage value by defaulting to false', () => {
    // @ts-ignore - Testing undefined value handling
    render(<PercentageSelector {...{ ...defaultProps, showPercentage: undefined }} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
  });
});
