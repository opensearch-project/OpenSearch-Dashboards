/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LegendOptionsPanel } from './legend';
import { Positions } from '../../types';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('LegendOptionsPanel', () => {
  const mockLegend = {
    show: true,
    position: Positions.BOTTOM,
  };

  const mockOnLegendChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <LegendOptionsPanel
        legendOptions={mockLegend}
        onLegendOptionsChange={mockOnLegendChange}
        shouldShowLegend={true}
      />
    );

    const legendModeSwitch = screen.getByTestId('legendModeSwitch');
    const legendPositionSelect = screen.getByTestId('legendPositionSelect');

    expect(legendModeSwitch).toBeInTheDocument();
    expect(legendPositionSelect).toBeInTheDocument();
  });

  it('update legend mode correctly', () => {
    render(
      <LegendOptionsPanel
        legendOptions={mockLegend}
        onLegendOptionsChange={mockOnLegendChange}
        shouldShowLegend={true}
      />
    );

    const legendModeSwitch = screen.getByTestId('legendModeSwitch');

    fireEvent.click(legendModeSwitch);
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

    const legendPositionSelect = screen.getByTestId('legendPositionSelect');

    fireEvent.change(legendPositionSelect, { target: { value: Positions.RIGHT } });
    expect(mockOnLegendChange).toHaveBeenLastCalledWith({
      position: Positions.RIGHT,
    });
  });
});
