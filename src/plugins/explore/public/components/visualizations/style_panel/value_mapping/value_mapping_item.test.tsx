/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValueMappingItem } from './value_mapping_item';
import { ValueMapping } from '../../types';

jest.mock('../color_group_panel/color_group_button', () => ({
  ColorGroupButton: ({ buttonColor, onChange }: any) => (
    <button data-test-subj="colorGroupButton" onClick={() => onChange('blue')}>
      {buttonColor}
    </button>
  ),
}));

jest.mock('../color_group_panel/select_color_button', () => ({
  SelectColorButton: ({ onChange }: any) => (
    <button onClick={() => onChange('green')}>Select Color</button>
  ),
}));

jest.mock('../utils', () => ({
  DebouncedFieldText: jest.fn(({ value, onChange, placeholder, ...rest }) => (
    <input
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder={placeholder}
      {...rest}
    />
  )),
  DebouncedFieldNumber: jest.fn(({ value, onChange, placeholder }) => (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder={placeholder}
      data-test-subj="debouncedFieldNumber"
    />
  )),
}));

describe('ValueMappingItem', () => {
  const mockOnChange = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders value mapping item', () => {
    const mapping: ValueMapping = {
      type: 'value',
      value: 'test',
      displayText: 'Test Display',
    };

    render(
      <ValueMappingItem id={0} mapping={mapping} onChange={mockOnChange} onDelete={mockOnDelete} />
    );

    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Display')).toBeInTheDocument();
  });

  it('renders range mapping item', () => {
    const mapping: ValueMapping = {
      type: 'range',
      range: { min: 1, max: 10 },
      displayText: 'Range Display',
    };

    render(
      <ValueMappingItem id={0} mapping={mapping} onChange={mockOnChange} onDelete={mockOnDelete} />
    );

    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('handles delete', () => {
    const mapping: ValueMapping = {
      type: 'value',
      value: 'test',
      displayText: 'Test',
    };

    render(
      <ValueMappingItem id={0} mapping={mapping} onChange={mockOnChange} onDelete={mockOnDelete} />
    );

    fireEvent.click(screen.getByLabelText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith(0);
  });

  it('handles color change', () => {
    const mapping: ValueMapping = {
      type: 'value',
      value: 'test',
      displayText: 'Test',
      color: 'black',
    };

    render(
      <ValueMappingItem id={0} mapping={mapping} onChange={mockOnChange} onDelete={mockOnDelete} />
    );

    fireEvent.click(screen.getByTestId('colorGroupButton'));
    expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({ color: 'blue' }));
  });

  it('handles color selection', () => {
    const mapping: ValueMapping = {
      type: 'value',
      value: 'test',
      displayText: 'Test',
    };

    render(
      <ValueMappingItem id={0} mapping={mapping} onChange={mockOnChange} onDelete={mockOnDelete} />
    );

    fireEvent.click(screen.getByText('Select Color'));
    expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({ color: 'green' }));
  });

  it('handles color removal', () => {
    const mapping: ValueMapping = {
      type: 'value',
      value: 'test',
      displayText: 'Test',
      color: 'red',
    };

    render(
      <ValueMappingItem id={0} mapping={mapping} onChange={mockOnChange} onDelete={mockOnDelete} />
    );

    fireEvent.click(screen.getByLabelText('DeleteColor'));
    expect(mockOnChange).toHaveBeenCalledWith(0, expect.objectContaining({ color: undefined }));
  });
});
