/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PieVisStyleControls, PieVisStyleControlsProps } from './pie_vis_options';
import { VisFieldType } from '../types';
import { defaultPieChartStyles } from './pie_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('PieVisStyleControls', () => {
  const mockProps: PieVisStyleControlsProps = {
    styleOptions: defaultPieChartStyles,
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
    ],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tabs', () => {
    render(<PieVisStyleControls {...mockProps} />);

    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Exclusive')).toBeInTheDocument();
  });

  it('renders the BasicVisOptions component in the first tab', () => {
    render(<PieVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /basic/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('generalSettingsPanel')).toBeInTheDocument();
  });

  it('renders the exclusive options component in the first tab', () => {
    render(<PieVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /exclusive/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('pieExclusivePanel')).toBeInTheDocument();
  });

  it('calls onStyleChange with the correct parameters when a style option changes', () => {
    render(<PieVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /basic/i });
    fireEvent.click(tab);
    const switchButton = screen.getByTestId('showLegendSwitch');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });
  });
});
