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
    axisColumnMappings: {},
    updateVisualization: jest.fn(),
    styleOptions: defaultMetricChartStyles,
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
    ],
    categoricalColumns: [],
    dateColumns: [],
    axisColumnMappings: { value: 'field-1' },
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the metric accordion', () => {
    render(<MetricVisStyleControls {...mockProps} />);

    expect(screen.getByText('Metric')).toBeInTheDocument();
  });

  it('renders the show title switch', () => {
    render(<MetricVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('showTitleSwitch')).toBeInTheDocument();
  });

  it('calls onStyleChange when show title switch is toggled', () => {
    render(<MetricVisStyleControls {...mockProps} />);
    const switchButton = screen.getByTestId('showTitleSwitch');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ showTitle: false });
  });
});
