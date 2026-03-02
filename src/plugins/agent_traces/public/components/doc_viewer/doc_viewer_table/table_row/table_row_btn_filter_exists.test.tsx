/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocViewTableRowBtnFilterExists } from './table_row_btn_filter_exists';

describe('DocViewTableRowBtnFilterExists', () => {
  const mockOnClick = jest.fn();

  const defaultProps = {
    onClick: mockOnClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button and handles click', () => {
    render(<DocViewTableRowBtnFilterExists {...defaultProps} />);

    const button = screen.getByTestId('addExistsFilterButton');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles disabled state', () => {
    render(<DocViewTableRowBtnFilterExists {...defaultProps} disabled={true} />);

    const button = screen.getByTestId('addExistsFilterButton');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('handles scripted prop', () => {
    render(<DocViewTableRowBtnFilterExists {...defaultProps} scripted={true} />);

    const button = screen.getByTestId('addExistsFilterButton');
    expect(button).not.toBeDisabled();
  });
});
