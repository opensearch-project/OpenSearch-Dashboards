/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SplitFieldSelector } from './split_field_selector';
import { VisColumn, VisFieldType } from './types';

describe('SplitFieldSelector', () => {
  const categoricalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'region',
      schema: VisFieldType.Categorical,
      column: 'region',
      validValuesCount: 100,
      uniqueValuesCount: 5,
    },
    {
      id: 2,
      name: 'status',
      schema: VisFieldType.Categorical,
      column: 'status',
      validValuesCount: 100,
      uniqueValuesCount: 3,
    },
  ];

  const numericalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'count',
      schema: VisFieldType.Numerical,
      column: 'count',
      validValuesCount: 100,
      uniqueValuesCount: 50,
    },
  ];

  const mockOnChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with "No split" as default when no split field is selected', () => {
    render(
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={numericalColumns}
        onSplitFieldChange={mockOnChange}
      />
    );

    const select = screen.getByTestId('splitFieldSelect');
    expect(select).toBeInTheDocument();
  });

  it('lists categorical and numerical columns as options', () => {
    render(
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={numericalColumns}
        onSplitFieldChange={mockOnChange}
      />
    );

    expect(screen.getByText('region')).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('count')).toBeInTheDocument();
  });

  it('calls onSplitFieldChange with field name when selection changes', () => {
    render(
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={numericalColumns}
        onSplitFieldChange={mockOnChange}
      />
    );

    const select = screen.getByTestId('splitFieldSelect');
    fireEvent.change(select, { target: { value: 'region' } });

    expect(mockOnChange).toHaveBeenCalledWith('region');
  });

  it('calls onSplitFieldChange with undefined when "No split" is selected', () => {
    render(
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={numericalColumns}
        splitField="region"
        onSplitFieldChange={mockOnChange}
      />
    );

    const select = screen.getByTestId('splitFieldSelect');
    fireEvent.change(select, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith(undefined);
  });

  it('shows the currently selected split field', () => {
    render(
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={numericalColumns}
        splitField="status"
        onSplitFieldChange={mockOnChange}
      />
    );

    const select = screen.getByTestId('splitFieldSelect') as HTMLSelectElement;
    expect(select.value).toBe('status');
  });

  it('is disabled when no columns are available', () => {
    render(
      <SplitFieldSelector
        categoricalColumns={[]}
        numericalColumns={[]}
        onSplitFieldChange={mockOnChange}
      />
    );

    const select = screen.getByTestId('splitFieldSelect');
    expect(select).toBeDisabled();
  });

  it('is enabled when columns are available', () => {
    render(
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={[]}
        onSplitFieldChange={mockOnChange}
      />
    );

    const select = screen.getByTestId('splitFieldSelect');
    expect(select).not.toBeDisabled();
  });
});
