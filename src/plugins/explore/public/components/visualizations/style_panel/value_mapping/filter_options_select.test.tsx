/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorModeOptionSelect } from './filter_options_select';
import { ColorModeOption } from '../../types';

describe('ColorModeOptionSelect', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<ColorModeOptionSelect colorModeOption="none" />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Color mode options')).toBeInTheDocument();
  });

  it('renders all options when hasDate is false and disableThreshold is false', () => {
    render(
      <ColorModeOptionSelect colorModeOption="none" hasDate={false} disableThreshold={false} />
    );

    const select = screen.getByRole('combobox');

    // Check that all options are present
    expect(select).toHaveDisplayValue('None');

    // Get all options
    const options = screen.getAllByRole('option');
    const optionValues = options.map((option) => option.getAttribute('value'));

    expect(optionValues).toEqual([
      'useValueMapping',
      'highlightValueMapping',
      'none',
      'useThresholdColor',
    ]);
  });

  it('hides value mapping options when hasDate is true', () => {
    render(
      <ColorModeOptionSelect colorModeOption="none" hasDate={true} disableThreshold={false} />
    );

    const options = screen.getAllByRole('option');
    const optionValues = options.map((option) => option.getAttribute('value'));

    expect(optionValues).toEqual(['none', 'useThresholdColor']);

    // Value mapping options should not be present
    expect(optionValues).not.toContain('useValueMapping');
    expect(optionValues).not.toContain('highlightValueMapping');
  });

  it('hides threshold option when disableThreshold is true', () => {
    render(
      <ColorModeOptionSelect colorModeOption="none" hasDate={false} disableThreshold={true} />
    );

    const options = screen.getAllByRole('option');
    const optionValues = options.map((option) => option.getAttribute('value'));

    expect(optionValues).toEqual(['useValueMapping', 'highlightValueMapping', 'none']);

    // Threshold option should not be present
    expect(optionValues).not.toContain('useThresholdColor');
  });

  it('hides both value mapping and threshold options when hasDate is true and disableThreshold is true', () => {
    render(<ColorModeOptionSelect colorModeOption="none" hasDate={true} disableThreshold={true} />);

    const options = screen.getAllByRole('option');
    const optionValues = options.map((option) => option.getAttribute('value'));

    expect(optionValues).toEqual(['none']);
  });

  it('sets default value to "none" when colorModeOption is undefined', () => {
    render(<ColorModeOptionSelect colorModeOption={undefined} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveDisplayValue('None');
  });

  it('displays correct value for each colorModeOption', () => {
    const testCases: Array<{ option: ColorModeOption; expectedText: string }> = [
      { option: 'useValueMapping', expectedText: 'Use value mappings' },
      { option: 'highlightValueMapping', expectedText: 'Highlight value mappings' },
      { option: 'none', expectedText: 'None' },
      { option: 'useThresholdColor', expectedText: 'Use Threshold Color' },
    ];

    testCases.forEach(({ option, expectedText }) => {
      const { rerender } = render(<ColorModeOptionSelect colorModeOption={option} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveDisplayValue(expectedText);

      rerender(<div />);
    });
  });

  it('calls onColorModeOptionChange when selection changes', () => {
    render(<ColorModeOptionSelect colorModeOption="none" onColorModeOptionChange={mockOnChange} />);

    const select = screen.getByRole('combobox');

    fireEvent.change(select, { target: { value: 'useValueMapping' } });

    expect(mockOnChange).toHaveBeenCalledWith('useValueMapping');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('does not call onColorModeOptionChange when it is not provided', () => {
    render(<ColorModeOptionSelect colorModeOption="none" />);

    const select = screen.getByRole('combobox');

    // This should not throw an error
    fireEvent.change(select, { target: { value: 'useValueMapping' } });

    // No error should occur and no function should be called
  });

  it('renders the correct label text', () => {
    render(<ColorModeOptionSelect colorModeOption="none" />);

    expect(screen.getByText('Color mode options')).toBeInTheDocument();
  });

  it('renders option text correctly for each language key', () => {
    render(
      <ColorModeOptionSelect colorModeOption="none" hasDate={false} disableThreshold={false} />
    );

    // Check that all option texts are rendered correctly
    expect(screen.getByText('Use value mappings')).toBeInTheDocument();
    expect(screen.getByText('Highlight value mappings')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Use Threshold Color')).toBeInTheDocument();
  });
});
