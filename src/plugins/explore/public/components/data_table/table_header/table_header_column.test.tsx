/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableHeaderColumn } from './table_header_column';

describe('TableHeaderColumn', () => {
  const mockOnRemoveColumn = jest.fn();

  const defaultProps = {
    displayName: 'Test Column',
    isRemoveable: true,
    name: 'test-column',
    onRemoveColumn: mockOnRemoveColumn,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the column header with display name', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    expect(screen.getByTestId('docTableHeaderField')).toBeInTheDocument();
    expect(screen.getByTestId('docTableHeader-test-column')).toBeInTheDocument();
    expect(screen.getByText('Test Column')).toBeInTheDocument();
  });

  it('renders remove button when column is removeable and onRemoveColumn is provided', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const removeButton = screen.getByTestId('docTableRemoveHeader-test-column');
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveAttribute('aria-label', 'Remove test-column column');
  });

  it('does not render remove button when column is not removeable', () => {
    render(<TableHeaderColumn {...defaultProps} isRemoveable={false} />);

    expect(screen.queryByTestId('docTableRemoveHeader-test-column')).not.toBeInTheDocument();
  });

  it('does not render remove button when onRemoveColumn is not provided', () => {
    render(<TableHeaderColumn {...defaultProps} onRemoveColumn={undefined} />);

    expect(screen.queryByTestId('docTableRemoveHeader-test-column')).not.toBeInTheDocument();
  });

  it('calls onRemoveColumn when remove button is clicked', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const removeButton = screen.getByTestId('docTableRemoveHeader-test-column');
    fireEvent.click(removeButton);

    expect(mockOnRemoveColumn).toHaveBeenCalledWith('test-column');
    expect(mockOnRemoveColumn).toHaveBeenCalledTimes(1);
  });

  it('applies correct CSS classes and attributes', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const headerField = screen.getByTestId('docTableHeaderField');
    expect(headerField).toHaveClass('exploreDocTableHeaderField');
    expect(headerField).toHaveAttribute('role', 'columnheader');
    expect(headerField).toHaveAttribute('aria-label', 'Discover table column: test-column');
  });

  it('renders with ReactNode as display name', () => {
    const complexDisplayName = (
      <span>
        <strong>Complex</strong> Column Name
      </span>
    );

    render(<TableHeaderColumn {...defaultProps} displayName={complexDisplayName} />);

    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('Column Name')).toBeInTheDocument();
  });

  it('shows tooltip on remove button hover', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const removeButton = screen.getByTestId('docTableRemoveHeader-test-column');
    expect(removeButton).toBeInTheDocument();

    // The tooltip content should be accessible via aria-label
    expect(removeButton).toHaveAttribute('aria-label', 'Remove test-column column');
  });

  it('renders correct button icon and styling', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const removeButton = screen.getByTestId('docTableRemoveHeader-test-column');
    expect(removeButton).toHaveClass('exploreDocTableHeaderField__actionButton');
  });

  it('handles special characters in column name', () => {
    const specialProps = {
      ...defaultProps,
      name: 'column-with-special@chars.field',
      displayName: 'Special Column',
    };

    render(<TableHeaderColumn {...specialProps} />);

    expect(
      screen.getByTestId('docTableHeader-column-with-special@chars.field')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('docTableRemoveHeader-column-with-special@chars.field')
    ).toBeInTheDocument();
  });
});
