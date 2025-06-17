/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricVisStyleControls, MetricVisStyleControlsProps } from './metric_vis_options';
import { VisFieldType } from '../types';
import { defaultMetricChartStyles } from './metric_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('MetricVisStyleControls', () => {
  const mockProps: MetricVisStyleControlsProps = {
    styleOptions: defaultMetricChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: [
      {
        id: 1,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-1',
      },
    ],
    categoricalColumns: [],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tabs', () => {
    render(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByText('Exclusive')).toBeInTheDocument();
  });

  it('renders the exclusive options component in the first tab', () => {
    render(<MetricVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /exclusive/i });
    fireEvent.click(tab);
    expect(screen.getByTestId('metricExclusivePanel')).toBeInTheDocument();
  });

  it('calls onStyleChange with the correct parameters when a style option changes', () => {
    render(<MetricVisStyleControls {...mockProps} />);
    const tab = screen.getByRole('tab', { name: /exclusive/i });
    fireEvent.click(tab);
    const switchButton = screen.getByTestId('showTitleButton');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ showTitle: false });
  });
});
