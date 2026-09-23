/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipOptionsPanel } from './tooltip';
import { TooltipOptions } from '../../types';

describe('TooltipOptionsPanel', () => {
  const mockTooltip: TooltipOptions = {
    mode: 'all',
  };

  const mockOnTooltipChange = jest.fn();

  it('renders tooltip options', () => {
    render(
      <TooltipOptionsPanel
        tooltipOptions={mockTooltip}
        onTooltipOptionsChange={mockOnTooltipChange}
      />
    );
    expect(screen.getByTestId('tooltipModeButtonGroup')).toBeInTheDocument();
    expect(screen.getByTestId('tooltipModeAll')).toBeInTheDocument();
    expect(screen.getByTestId('tooltipModeSingle')).toBeInTheDocument();
    expect(screen.getByTestId('tooltipModeHidden')).toBeInTheDocument();
  });

  it('updates tooltip mode to single', () => {
    render(
      <TooltipOptionsPanel
        tooltipOptions={mockTooltip}
        onTooltipOptionsChange={mockOnTooltipChange}
      />
    );

    fireEvent.click(screen.getByTestId('tooltipModeSingle'));
    expect(mockOnTooltipChange).toHaveBeenLastCalledWith({
      mode: 'single',
    });
  });

  it('updates tooltip mode to hidden', () => {
    render(
      <TooltipOptionsPanel
        tooltipOptions={mockTooltip}
        onTooltipOptionsChange={mockOnTooltipChange}
      />
    );

    fireEvent.click(screen.getByTestId('tooltipModeHidden'));
    expect(mockOnTooltipChange).toHaveBeenLastCalledWith({
      mode: 'hidden',
    });
  });
});
