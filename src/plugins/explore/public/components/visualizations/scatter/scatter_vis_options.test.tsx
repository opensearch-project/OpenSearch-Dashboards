/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScatterVisStyleControls, ScatterVisStyleControlsProps } from './scatter_vis_options';
import { VisFieldType, Positions, AxisRole } from '../types';
import { defaultScatterChartStyles } from './scatter_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('ScatterVisStyleControls', () => {
  const mockProps: ScatterVisStyleControlsProps = {
    styleOptions: defaultScatterChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: [
      {
        id: 1,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-1',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
      {
        id: 2,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-2',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
    ],
    categoricalColumns: [],
    dateColumns: [],
    axisColumnMappings: {
      [AxisRole.X]: {
        id: 1,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-1',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
      [AxisRole.Y]: {
        id: 2,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-2',
        validValuesCount: 1,
        uniqueValuesCount: 1,
      },
    },
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Fields section', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('renders the Axis section', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    expect(screen.getByText('Axis')).toBeInTheDocument();
  });

  it('renders the Scatter section', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    expect(screen.getByText('Scatter')).toBeInTheDocument();
  });

  it('renders the Grid section', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    expect(screen.getByText('Grid')).toBeInTheDocument();
  });

  it('calls onStyleChange to infer fields for StandardAxes when component renders', () => {
    render(<ScatterVisStyleControls {...mockProps} />);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        StandardAxes: expect.arrayContaining([
          expect.objectContaining({
            axisRole: 'x',
            field: expect.objectContaining({
              default: expect.objectContaining({
                name: mockProps.numericalColumns![0].name,
              }),
            }),
          }),
          expect.objectContaining({
            axisRole: 'y',
            field: expect.objectContaining({
              default: expect.objectContaining({
                name: mockProps!.numericalColumns![1].name,
              }),
            }),
          }),
        ]),
      })
    );
  });

  it('calls onStyleChange with the correct parameters when the switch axes button is clicked', () => {
    render(<ScatterVisStyleControls {...mockProps} />);

    // Find the Switch X and Y button
    const switchButton = screen.getByText('Switch X and Y');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        StandardAxes: expect.arrayContaining([
          expect.objectContaining({
            axisRole: 'y',
            position: Positions.LEFT,
            field: expect.objectContaining({
              default: expect.objectContaining({
                name: mockProps.numericalColumns![0].name,
              }),
            }),
          }),
          expect.objectContaining({
            axisRole: 'x',
            position: Positions.BOTTOM,
            field: expect.objectContaining({
              default: expect.objectContaining({
                name: mockProps!.numericalColumns![1].name,
              }),
            }),
          }),
        ]),
      })
    );
  });

  it('renders the Tooltip section', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    expect(screen.getByText('Tooltip')).toBeInTheDocument();
  });
});
