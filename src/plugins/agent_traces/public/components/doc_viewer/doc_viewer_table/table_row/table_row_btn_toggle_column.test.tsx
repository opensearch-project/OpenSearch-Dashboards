/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocViewTableRowBtnToggleColumn } from './table_row_btn_toggle_column';

describe('DocViewTableRowBtnToggleColumn', () => {
  const mockOnClick = jest.fn();

  const defaultProps = {
    active: false,
    onClick: mockOnClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button and handles click', () => {
    render(<DocViewTableRowBtnToggleColumn {...defaultProps} />);

    const button = screen.getByTestId('toggleColumnButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('shows active state', () => {
    render(<DocViewTableRowBtnToggleColumn {...defaultProps} active={true} />);

    const button = screen.getByTestId('toggleColumnButton');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles disabled state', () => {
    render(<DocViewTableRowBtnToggleColumn {...defaultProps} disabled={true} />);

    const button = screen.getByTestId('toggleColumnButton');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
