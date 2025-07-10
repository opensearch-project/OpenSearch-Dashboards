/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LegendOptionsPanel } from './legend';
import { Positions } from '../../types';

describe('LegendOptionsPanel', () => {
  const mockLegend = {
    show: true,
    position: Positions.BOTTOM,
  };

  const mockOnLegendChange = jest.fn();

  it('renders correctly', () => {
    render(
      <LegendOptionsPanel
        legendOptions={mockLegend}
        onLegendOptionsChange={mockOnLegendChange}
        shouldShowLegend={true}
      />
    );

    const legendModeButtonGroup = screen.getByTestId('legendModeButtonGroup');
    const legendPositionButtonGroup = screen.getByTestId('legendPositionButtonGroup');

    expect(legendModeButtonGroup).toBeInTheDocument();
    expect(legendPositionButtonGroup).toBeInTheDocument();
  });

  it('update legend mode correctly', () => {
    render(
      <LegendOptionsPanel
        legendOptions={mockLegend}
        onLegendOptionsChange={mockOnLegendChange}
        shouldShowLegend={true}
      />
    );

    const legendModeButtonGroup = screen.getByTestId('legendModeButtonGroup');
    const modeButton = within(legendModeButtonGroup).getByTestId('false');

    fireEvent.click(modeButton);
    expect(mockOnLegendChange).toHaveBeenLastCalledWith({
      show: false,
    });
  });

  it('update legend position correctly', () => {
    render(
      <LegendOptionsPanel
        legendOptions={mockLegend}
        onLegendOptionsChange={mockOnLegendChange}
        shouldShowLegend={true}
      />
    );

    const legendPositionButtonGroup = screen.getByTestId('legendPositionButtonGroup');
    const positionButton = within(legendPositionButtonGroup).getByTestId('right');

    fireEvent.click(positionButton);
    expect(mockOnLegendChange).toHaveBeenLastCalledWith({
      position: Positions.RIGHT,
    });
  });
});
