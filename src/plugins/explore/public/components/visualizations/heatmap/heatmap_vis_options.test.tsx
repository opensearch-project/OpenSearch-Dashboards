/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeatmapVisStyleControls, HeatmapVisStyleControlsProps } from './heatmap_vis_options';
import { VisFieldType, Positions } from '../types';
import { defaultHeatmapChartStyles } from './heatmap_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('HeatmapVisStyleControls', () => {
  const mockProps: HeatmapVisStyleControlsProps = {
    styleOptions: defaultHeatmapChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: [
      {
        id: 1,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-1',
      },
    ],
    categoricalColumns: [
      {
        id: 2,
        name: 'category',
        schema: VisFieldType.Categorical,
        column: 'field-2',
      },
      {
        id: 3,
        name: 'category',
        schema: VisFieldType.Categorical,
        column: 'field-2',
      },
    ],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tabs', () => {
    render(<HeatmapVisStyleControls {...mockProps} />);

    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Exclusive')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('Axes')).toBeInTheDocument();
  });

  it('renders the BasicVisOptions component in the first tab', () => {
    render(<HeatmapVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /basic/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('generalSettingsPanel')).toBeInTheDocument();
  });

  it('renders the exclusive options component in the first tab', () => {
    render(<HeatmapVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /exclusive/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('heatmapExclusivePanel')).toBeInTheDocument();
  });

  it('renders the label options component in the first tab', () => {
    render(<HeatmapVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /label/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('heatmapLabelPanel')).toBeInTheDocument();
  });

  it('renders the axes options component in the first tab', () => {
    render(<HeatmapVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /axes/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('standardAxesPanel')).toBeInTheDocument();
  });

  it('calls onStyleChange to infer fields for StandardAxes when component renders', () => {
    render(<HeatmapVisStyleControls {...mockProps} />);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        StandardAxes: expect.arrayContaining([
          expect.objectContaining({
            axisRole: 'x',
            field: expect.objectContaining({
              default: expect.objectContaining({
                name: mockProps.categoricalColumns![0].name,
              }),
            }),
          }),
          expect.objectContaining({
            axisRole: 'y',
            field: expect.objectContaining({
              default: expect.objectContaining({
                name: mockProps!.categoricalColumns![1].name,
              }),
            }),
          }),
        ]),
      })
    );
  });

  it('calls onStyleChange with the correct parameters when a style option changes', () => {
    render(<HeatmapVisStyleControls {...mockProps} />);
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
                name: mockProps.categoricalColumns![0].name,
              }),
            }),
          }),
          expect.objectContaining({
            axisRole: 'x',
            position: Positions.BOTTOM,
            field: expect.objectContaining({
              default: expect.objectContaining({
                name: mockProps!.categoricalColumns![1].name,
              }),
            }),
          }),
        ]),
      })
    );
  });
});
