/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScatterVisStyleControls, ScatterVisStyleControlsProps } from './scatter_vis_options';
import { VisFieldType, Positions } from '../types';
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
      },
      {
        id: 2,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-2',
      },
    ],
    categoricalColumns: [],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tabs', () => {
    render(<ScatterVisStyleControls {...mockProps} />);

    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Exclusive')).toBeInTheDocument();
    expect(screen.getByText('Axes')).toBeInTheDocument();
  });

  it('renders the BasicVisOptions component in the first tab', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /basic/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('generalSettingsPanel')).toBeInTheDocument();
  });

  it('renders the exclusive options component in the first tab', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /exclusive/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('scatterExclusivePanel')).toBeInTheDocument();
  });

  it('renders the axes options component in the first tab', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /axes/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('standardAxesPanel')).toBeInTheDocument();
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

  it('calls onStyleChange with the correct parameters when a style option changes', () => {
    render(<ScatterVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /axes/i });
    fireEvent.click(tab);
    const switchButton = screen.getByTestId('switchAxesButton');
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
});
