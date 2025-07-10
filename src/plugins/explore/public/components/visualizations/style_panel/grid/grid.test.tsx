/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GridOptionsPanel } from './grid';

describe('GridOptionsPanel', () => {
  const mockGrid = {
    categoryLines: true,
    valueLines: false,
  };

  const mockOnGridChange = jest.fn();

  it('renders category lines and value lines options', () => {
    render(<GridOptionsPanel grid={mockGrid} onGridChange={mockOnGridChange} />);

    const categoryLinesButtonGroup = screen.getByTestId('categoryLinesButtonGroup');
    const valueLinesButtonGroup = screen.getByTestId('valueLinesButtonGroup');

    expect(categoryLinesButtonGroup).toBeInTheDocument();
    expect(valueLinesButtonGroup).toBeInTheDocument();
  });

  it('updates category lines option', () => {
    render(<GridOptionsPanel grid={mockGrid} onGridChange={mockOnGridChange} />);

    const categoryLinesButtonGroup = screen.getByTestId('categoryLinesButtonGroup');
    const hiddenButton = within(categoryLinesButtonGroup).getByTestId('hidden');

    fireEvent.click(hiddenButton);

    expect(mockOnGridChange).toHaveBeenCalledWith({
      ...mockGrid,
      categoryLines: false,
    });
  });

  it('updates value lines option', () => {
    render(<GridOptionsPanel grid={mockGrid} onGridChange={mockOnGridChange} />);

    const valueLinesButtonGroup = screen.getByTestId('valueLinesButtonGroup');
    const shownButton = within(valueLinesButtonGroup).getByTestId('shown');

    fireEvent.click(shownButton);

    expect(mockOnGridChange).toHaveBeenCalledWith({
      ...mockGrid,
      valueLines: true,
    });
  });
});
