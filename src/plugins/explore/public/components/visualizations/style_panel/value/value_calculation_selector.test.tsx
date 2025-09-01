/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ValueCalculationSelector } from './value_calculation_selector';

describe('ValueCalculationSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ValueCalculationSelector />);
    expect(container).toBeInTheDocument();
  });

  it('renders with default value', () => {
    render(<ValueCalculationSelector />);
    // The default value is 'last'
    expect(screen.getByText('Last')).toBeInTheDocument();
  });

  it('renders with provided selected value', () => {
    render(<ValueCalculationSelector selectedValue="mean" />);
    expect(screen.getByText('Mean')).toBeInTheDocument();
  });

  it('calls onChange when a new value is selected', async () => {
    render(<ValueCalculationSelector selectedValue="last" onChange={mockOnChange} />);

    // Open the dropdown
    const dropdown = screen.getByText('Last');
    fireEvent.click(dropdown);

    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Mean')).toBeInTheDocument();
    });

    // Select a different option
    fireEvent.click(screen.getByText('Mean'));

    // Verify onChange was called with the correct value
    expect(mockOnChange).toHaveBeenCalledWith('mean');
  });

  it('renders all calculation options in the dropdown', async () => {
    render(<ValueCalculationSelector />);

    // Open the dropdown
    const dropdown = screen.getByText('Last');
    fireEvent.click(dropdown);

    // Wait for dropdown options to appear and verify all options are present
    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Min')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
      expect(screen.getByText('Mean')).toBeInTheDocument();
      expect(screen.getByText('Median')).toBeInTheDocument();
      expect(screen.getByText('Variance')).toBeInTheDocument();
      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('Distinct count')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  it('displays the correct description for each option', async () => {
    render(<ValueCalculationSelector />);

    // Open the dropdown
    const dropdown = screen.getByText('Last');
    fireEvent.click(dropdown);

    // Wait for dropdown options to appear
    await waitFor(() => {
      // Check descriptions for a few options
      expect(screen.getByText('Last value')).toBeInTheDocument();
      expect(screen.getByText('First value')).toBeInTheDocument();
      expect(screen.getByText('Minimum value')).toBeInTheDocument();
      expect(screen.getByText('Maximum value')).toBeInTheDocument();
      expect(screen.getByText('Average value')).toBeInTheDocument();
      expect(screen.getByText('Middle value')).toBeInTheDocument();
      expect(screen.getByText('Statistical variance')).toBeInTheDocument();
      expect(screen.getByText('Number of values')).toBeInTheDocument();
      expect(screen.getByText('Number of unique values')).toBeInTheDocument();
      expect(screen.getByText('Sum of all values')).toBeInTheDocument();
    });
  });

  it('uses the provided onChange handler', async () => {
    render(<ValueCalculationSelector selectedValue="last" onChange={mockOnChange} />);

    // Open the dropdown
    const dropdown = screen.getByText('Last');
    fireEvent.click(dropdown);

    // Select a different option
    await waitFor(() => {
      fireEvent.click(screen.getByText('Total'));
    });

    // Verify onChange was called with the correct value
    expect(mockOnChange).toHaveBeenCalledWith('total');
  });
});
