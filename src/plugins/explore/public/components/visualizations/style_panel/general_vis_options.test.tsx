/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneralVisOptions } from './general_vis_options';
import { Positions } from '../types';

describe('GeneralVisOptions', () => {
  const defaultProps = {
    addTooltip: true,
    addLegend: true,
    legendPosition: Positions.RIGHT,
    onAddTooltipChange: jest.fn(),
    onAddLegendChange: jest.fn(),
    onLegendPositionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<GeneralVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders basic settings title', () => {
    render(<GeneralVisOptions {...defaultProps} />);
    expect(screen.getByText('Basic Settings')).toBeInTheDocument();
  });

  it('calls onAddLegendChange when show legend switch is toggled', () => {
    render(<GeneralVisOptions {...defaultProps} />);
    const showLegendSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(showLegendSwitch);
    expect(defaultProps.onAddLegendChange).toHaveBeenCalledWith(false);
  });

  it('hides legend position select when show legend is false', () => {
    const props = {
      ...defaultProps,
      addLegend: false,
    };
    render(<GeneralVisOptions {...props} />);

    expect(screen.queryByText('Legend position')).not.toBeInTheDocument();
  });

  it('hides legend when shouldShowLegend is false', () => {
    const props = {
      ...defaultProps,
      shouldShowLegend: false,
    };
    render(<GeneralVisOptions {...props} />);

    expect(screen.queryByText('Show legend')).not.toBeInTheDocument();
    expect(screen.queryByText('Legend position')).not.toBeInTheDocument();
  });

  it('calls onLegendPositionChange when legend position is changed', () => {
    render(<GeneralVisOptions {...defaultProps} />);
    const legendPositionSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(legendPositionSelect, { target: { value: Positions.BOTTOM } });
    expect(defaultProps.onLegendPositionChange).toHaveBeenCalledWith(Positions.BOTTOM);
  });

  it('calls onAddTooltipChange when show tooltip switch is toggled', () => {
    render(<GeneralVisOptions {...defaultProps} />);
    const showTooltipSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(showTooltipSwitch);
    expect(defaultProps.onAddTooltipChange).toHaveBeenCalledWith(false);
  });
});
