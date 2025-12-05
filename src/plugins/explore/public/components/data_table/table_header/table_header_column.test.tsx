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
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    // Mock document.execCommand for fallback
    document.execCommand = jest.fn().mockReturnValue(true);
  });

  it('renders the column header with display name', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    expect(screen.getByTestId('docTableHeaderField')).toBeInTheDocument();
    expect(screen.getByTestId('docTableHeader-test-column')).toBeInTheDocument();
    expect(screen.getByText('Test Column')).toBeInTheDocument();
  });

  it('renders copy button for all columns', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const copyButton = screen.getByTestId('docTableCopyHeader-test-column');
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveAttribute('aria-label', 'Copy test-column column name');
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

  it('calls clipboard API when copy button is clicked', async () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const copyButton = screen.getByTestId('docTableCopyHeader-test-column');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test-column');
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
  });

  it('falls back to document.execCommand when clipboard API fails', async () => {
    // Mock clipboard API to fail
    navigator.clipboard.writeText = jest.fn().mockRejectedValue(new Error('Clipboard API failed'));

    render(<TableHeaderColumn {...defaultProps} />);

    const copyButton = screen.getByTestId('docTableCopyHeader-test-column');
    fireEvent.click(copyButton);

    // Wait for the fallback to execute
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('renders both copy and remove buttons when column is removeable', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    expect(screen.getByTestId('docTableCopyHeader-test-column')).toBeInTheDocument();
    expect(screen.getByTestId('docTableRemoveHeader-test-column')).toBeInTheDocument();
  });

  it('renders only copy button when column is not removeable', () => {
    render(<TableHeaderColumn {...defaultProps} isRemoveable={false} />);

    expect(screen.getByTestId('docTableCopyHeader-test-column')).toBeInTheDocument();
    expect(screen.queryByTestId('docTableRemoveHeader-test-column')).not.toBeInTheDocument();
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

  it('shows tooltip on copy button hover', () => {
    render(<TableHeaderColumn {...defaultProps} />);

    const copyButton = screen.getByTestId('docTableCopyHeader-test-column');
    expect(copyButton).toBeInTheDocument();

    // The tooltip content should be accessible via aria-label
    expect(copyButton).toHaveAttribute('aria-label', 'Copy test-column column name');
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
