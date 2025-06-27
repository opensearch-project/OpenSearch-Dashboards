/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChartTypeSwitcher } from './chart_type_switcher';
import { ChartTypeMapping } from '../types';

describe('ChartTypeSwitcher', () => {
  const mockChartTypes: ChartTypeMapping[] = [
    { type: 'bar', priority: 80, name: 'Bar Chart' },
    { type: 'line', priority: 100, name: 'Line Chart' },
    { type: 'pie', priority: 60, name: 'Pie Chart' },
  ];

  const defaultProps = {
    availableChartTypes: mockChartTypes,
    onChartTypeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ChartTypeSwitcher {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders the visualization type title', () => {
    render(<ChartTypeSwitcher {...defaultProps} />);
    expect(screen.getByText('Visualization Type')).toBeInTheDocument();
  });

  it('sorts chart types by priority and selects the highest priority by default', () => {
    render(<ChartTypeSwitcher {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('line'); // line has highest priority (100)
  });

  it('uses the selectedChartType prop when provided', () => {
    render(<ChartTypeSwitcher {...defaultProps} selectedChartType="bar" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('bar');
  });

  it('calls onChartTypeChange when a new chart type is selected', () => {
    render(<ChartTypeSwitcher {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'pie' } });
    expect(defaultProps.onChartTypeChange).toHaveBeenCalledWith('pie');
  });

  it('renders all available chart types as options', () => {
    render(<ChartTypeSwitcher {...defaultProps} />);
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
    expect(screen.getByText('Bar Chart')).toBeInTheDocument();
    expect(screen.getByText('Pie Chart')).toBeInTheDocument();
  });

  it('returns null when no chart types are available', () => {
    const { container } = render(<ChartTypeSwitcher availableChartTypes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('updates when selectedChartType prop changes', () => {
    const { rerender } = render(<ChartTypeSwitcher {...defaultProps} selectedChartType="bar" />);
    expect(screen.getByRole('combobox')).toHaveValue('bar');

    rerender(<ChartTypeSwitcher {...defaultProps} selectedChartType="pie" />);
    expect(screen.getByRole('combobox')).toHaveValue('pie');
  });

  it('has the correct aria-label for accessibility', () => {
    render(<ChartTypeSwitcher {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', 'Select visualization type');
  });

  it('has the correct data-test-subj for testing', () => {
    render(<ChartTypeSwitcher {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('data-test-subj', 'chartTypeSelect');
  });
});
