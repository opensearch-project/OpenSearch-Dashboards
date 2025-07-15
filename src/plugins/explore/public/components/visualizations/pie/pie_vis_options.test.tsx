/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PieVisStyleControls, PieVisStyleControlsProps } from './pie_vis_options';
import { VisFieldType, AxisRole } from '../types';
import { defaultPieChartStyles } from './pie_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('PieVisStyleControls', () => {
  const numericalColumn = {
    id: 1,
    name: 'value',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const categoricalColumn = {
    id: 2,
    name: 'category',
    schema: VisFieldType.Categorical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const mockProps: PieVisStyleControlsProps = {
    axisColumnMappings: {
      [AxisRole.SIZE]: numericalColumn,
      [AxisRole.COLOR]: categoricalColumn,
    },
    updateVisualization: jest.fn(),
    styleOptions: defaultPieChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: [numericalColumn],
    categoricalColumns: [categoricalColumn],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the fields accordion', () => {
    render(<PieVisStyleControls {...mockProps} />);

    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('renders the pie exclusive options accordion', () => {
    render(<PieVisStyleControls {...mockProps} />);
    // Use a more specific selector to find the accordion header
    expect(screen.getByRole('button', { name: /show as/i })).toBeInTheDocument();
  });

  it('renders the legend options accordion', () => {
    render(<PieVisStyleControls {...mockProps} />);
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('calls onStyleChange with the correct parameters when a legend option changes', () => {
    render(<PieVisStyleControls {...mockProps} />);
    const switchButton = screen.getByTestId('legendModeSwitch');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });
  });
});
