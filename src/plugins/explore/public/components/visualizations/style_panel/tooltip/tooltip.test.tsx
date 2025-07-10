/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
    const toolTip = screen.getByTestId('tooltipModeButtonGroup');
    expect(toolTip).toBeInTheDocument();
  });

  it('update tooltip mode', () => {
    render(
      <TooltipOptionsPanel
        tooltipOptions={mockTooltip}
        onTooltipOptionsChange={mockOnTooltipChange}
      />
    );

    const toolTipModeGroup = screen.getByTestId('tooltipModeButtonGroup');
    const hiddenButton = within(toolTipModeGroup).getByTestId('hidden');

    fireEvent.click(hiddenButton);
    expect(mockOnTooltipChange).toHaveBeenLastCalledWith({
      mode: 'hidden',
    });
  });
});
