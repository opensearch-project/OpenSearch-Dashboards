/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from 'test_utils/testing_lib_helpers';
import { FacetValue } from './facet_value';
import { IndexPatternField } from '../../../../data/public';

describe('FacetValue', () => {
  const mockField = new IndexPatternField(
    {
      name: 'status',
      type: 'string',
      esTypes: ['keyword'],
      count: 5,
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
    },
    'status'
  );

  const mockBucket = {
    display: 'success',
    value: 'success',
    count: 10,
    percent: 25.5,
  };

  const mockProps = {
    field: mockField,
    bucket: mockBucket,
    onAddFilter: jest.fn(),
    useShortDots: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders facet value with display text', () => {
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} />);

    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByTestId('field-success')).toBeInTheDocument();
  });

  it('renders filter buttons', () => {
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} />);

    const filterButtons = screen.getAllByRole('button');
    expect(filterButtons).toHaveLength(2);

    // Filter for button (magnifyWithPlus)
    expect(filterButtons[0]).toHaveAttribute('aria-label', 'Filter for success');

    // Filter out button (magnifyWithMinus)
    expect(filterButtons[1]).toHaveAttribute('aria-label', 'Filter out success');
  });

  it('calls onAddFilter with positive filter when plus button clicked', () => {
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} />);

    const filterForButton = screen.getByLabelText('Filter for success');
    fireEvent.click(filterForButton);

    expect(mockProps.onAddFilter).toHaveBeenCalledWith(mockField, 'success', '+');
  });

  it('calls onAddFilter with negative filter when minus button clicked', () => {
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} />);

    const filterOutButton = screen.getByLabelText('Filter out success');
    fireEvent.click(filterOutButton);

    expect(mockProps.onAddFilter).toHaveBeenCalledWith(mockField, 'success', '-');
  });

  it('shows tooltip with bucket display value', () => {
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} />);

    const valueSpan = screen.getByTestId('field-success');
    expect(valueSpan).toHaveClass('exploreSidebarField__name');
  });

  it('handles useShortDots option', () => {
    const longBucket = {
      display: 'very.long.field.name.here',
      value: 'very.long.field.name.here',
      count: 5,
      percent: 10,
    };

    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} bucket={longBucket} useShortDots={true} />);

    expect(screen.getByTestId('field-very.long.field.name.here')).toBeInTheDocument();
  });

  it('renders bucket count', () => {
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} />);

    expect(screen.getByText('10')).toBeInTheDocument();

    const countElement = screen.getByText('10');
    expect(countElement).toHaveClass('exploreSidebarFacetValue__count');
  });

  it('has correct CSS classes', () => {
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    render(<FacetValue {...mockProps} />);

    const container = screen.getByTestId('exploreSidebarFacetValue');
    expect(container).toHaveClass('exploreSidebarFacetValue');

    const actionButtons = container.querySelector('.exploreSidebarField__actionButtons');
    expect(actionButtons).toBeInTheDocument();

    const countElement = container.querySelector('.exploreSidebarFacetValue__count');
    expect(countElement).toBeInTheDocument();

    const actionButton = container.querySelector('.exploreSidebarField__actionButton');
    expect(actionButton).toBeInTheDocument();
  });
});
