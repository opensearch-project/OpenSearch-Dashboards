/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValueMappingSection, EditValueMappingsModel } from './value_mapping_section';
import { ValueMapping } from '../../types';

jest.mock('../color_group_panel/color_group_button', () => ({
  ColorGroupButton: ({ buttonColor, onChange }: any) => (
    <button onClick={() => onChange('blue')}>{buttonColor}</button>
  ),
}));

jest.mock('./value_mapping_item', () => ({
  ValueMappingItem: ({ mapping }: any) => (
    <div data-test-subj="mapping-item">
      <span>{mapping.displayText}</span>
    </div>
  ),
}));

describe('ValueMappingSection', () => {
  const mockOnChange = jest.fn();
  const valueMappings: ValueMapping[] = [
    { type: 'value', value: 'test', displayText: 'Test Value', color: 'red' },
    { type: 'range', range: { min: 1, max: 10 }, displayText: 'Test Range' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders value mappings', () => {
    render(<ValueMappingSection valueMappings={valueMappings} onChange={mockOnChange} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('[1, 10]')).toBeInTheDocument();
  });

  it('opens modal when edit button is clicked', () => {
    render(<ValueMappingSection valueMappings={valueMappings} onChange={mockOnChange} />);
    fireEvent.click(screen.getByTestId('valueMappingEditButton'));
    expect(screen.getByText('Value mappings')).toBeInTheDocument();
  });

  it('handles color change', () => {
    render(<ValueMappingSection valueMappings={valueMappings} onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('red'));
    expect(mockOnChange).toHaveBeenCalledWith([
      { type: 'value', value: 'test', displayText: 'Test Value', color: 'blue' },
      { type: 'range', range: { min: 1, max: 10 }, displayText: 'Test Range' },
    ]);
  });
});

describe('EditValueMappingsModel', () => {
  const mockOnChange = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds new value mapping', () => {
    render(<EditValueMappingsModel onChange={mockOnChange} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('+ Add new mapping'));
    fireEvent.click(screen.getByText('Value'));
    expect(screen.getByTestId('mapping-item')).toBeInTheDocument();
  });

  it('saves mappings', () => {
    render(<EditValueMappingsModel onChange={mockOnChange} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Save'));
    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('cancels modal', () => {
    render(<EditValueMappingsModel onChange={mockOnChange} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
