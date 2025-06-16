/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridOptionsPanel } from './grid_options';
import { GridOptions } from '../types';

describe('GridOptionsPanel', () => {
  const defaultGrid: GridOptions = {
    categoryLines: true,
    valueLines: true,
  };

  const onGridChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <GridOptionsPanel grid={defaultGrid} onGridChange={onGridChange} />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders grid settings title', () => {
    render(<GridOptionsPanel grid={defaultGrid} onGridChange={onGridChange} />);
    expect(screen.getByText('Grid Settings')).toBeInTheDocument();
  });

  it('renders category lines switch', () => {
    render(<GridOptionsPanel grid={defaultGrid} onGridChange={onGridChange} />);
    expect(screen.getByText('Show category lines')).toBeInTheDocument();
  });

  it('renders value lines switch', () => {
    render(<GridOptionsPanel grid={defaultGrid} onGridChange={onGridChange} />);
    expect(screen.getByText('Show value lines')).toBeInTheDocument();
  });

  it('calls onGridChange when category lines switch is toggled', () => {
    render(<GridOptionsPanel grid={defaultGrid} onGridChange={onGridChange} />);
    const categoryLinesSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(categoryLinesSwitch);

    expect(onGridChange).toHaveBeenCalledWith({
      ...defaultGrid,
      categoryLines: false,
    });
  });

  it('calls onGridChange when value lines switch is toggled', () => {
    render(<GridOptionsPanel grid={defaultGrid} onGridChange={onGridChange} />);
    const valueLinesSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(valueLinesSwitch);

    expect(onGridChange).toHaveBeenCalledWith({
      ...defaultGrid,
      valueLines: false,
    });
  });

  it('renders switches with correct initial state', () => {
    const customGrid: GridOptions = {
      categoryLines: false,
      valueLines: true,
    };

    render(<GridOptionsPanel grid={customGrid} onGridChange={onGridChange} />);

    const categoryLinesSwitch = screen.getAllByRole('switch')[0];
    const valueLinesSwitch = screen.getAllByRole('switch')[1];

    expect(categoryLinesSwitch).not.toBeChecked();
    expect(valueLinesSwitch).toBeChecked();
  });
});
