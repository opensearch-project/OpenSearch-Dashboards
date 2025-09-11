/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  HeatmapExclusiveVisOptions,
  HeatmapLabelVisOptions,
} from './heatmap_exclusive_vis_options';
import { ColorSchemas, ScaleType, AggregationType } from '../types';

describe('HeatmapExclusiveVisOptions', () => {
  const defaultProps = {
    styles: {
      colorSchema: ColorSchemas.BLUES,
      reverseSchema: false,
      colorScaleType: ScaleType.LINEAR,
      scaleToDataBounds: false,
      percentageMode: false,
      maxNumberOfColors: 4,
      useThresholdColor: false,
      label: {
        type: AggregationType.SUM,
        show: false,
        rotate: false,
        overwriteColor: false,
        color: 'black',
      },
    },
    shouldShowType: true,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders exclusive settings title', () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    expect(screen.getByText('Heatmap')).toBeInTheDocument();
  });
  it('calls onChange when change is made(reverse schema)', () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    const reverse = screen.getAllByRole('switch')[0];
    fireEvent.click(reverse);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      reverseSchema: true,
    });
  });

  it('calls onChange when color schema is changed', () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: ColorSchemas.GREENS } });

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      colorSchema: ColorSchemas.GREENS,
    });
  });

  it('calls onChange when color scale type is changed to log', () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);

    const logButton = screen.getByTestId('log');
    fireEvent.click(logButton);

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      colorScaleType: ScaleType.LOG,
    });
  });

  it('disables scaleToDataBounds switch when percentageMode is true', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        percentageMode: true,
      },
    };

    render(<HeatmapExclusiveVisOptions {...props} />);
    const switchEl = screen.getByTestId('scaleToDataBounds');
    expect(switchEl).toBeDisabled();
  });

  it('disables percentageMode switch when useThresholdColor is true', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        useThresholdColor: true,
      },
    };

    render(<HeatmapExclusiveVisOptions {...props} />);
    const switchEl = screen.getByTestId('percentageMode');
    expect(switchEl).toBeDisabled();
  });

  it('disables maxNumberOfColors input when useThresholdColor is true', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        useThresholdColor: true,
      },
    };

    render(<HeatmapExclusiveVisOptions {...props} />);
    const input = screen.getByTestId('visHeatmapMaxNumberOfColors');
    expect(input).toBeDisabled();
  });

  it('toggles scaleToDataBounds and calls onChange', () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    const scaleToDataBoundsSwitch = screen.getByTestId('scaleToDataBounds');
    fireEvent.click(scaleToDataBoundsSwitch);

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      scaleToDataBounds: true,
    });
  });

  it('toggles percentageMode and calls onChange', () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    const percentageModeSwitch = screen.getByTestId('percentageMode');
    fireEvent.click(percentageModeSwitch);

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      percentageMode: true,
    });
  });

  it('updates maxNumberOfColors and calls onChange after debounce', async () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    const input = screen.getByTestId('visHeatmapMaxNumberOfColors');

    fireEvent.change(input, { target: { value: '10' } });

    await waitFor(() => {
      expect(defaultProps.onChange).toHaveBeenCalledWith({
        ...defaultProps.styles,
        maxNumberOfColors: 10,
      });
    });
  });
});

describe('HeatmapLabelVisOptions', () => {
  const defaultProps = {
    shouldShowType: true,
    styles: {
      type: AggregationType.SUM,
      show: false,
      rotate: false,
      overwriteColor: false,
      color: 'black',
    },
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<HeatmapLabelVisOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders exclusive settings title', () => {
    render(<HeatmapLabelVisOptions {...defaultProps} />);
    expect(screen.getByText('Show labels')).toBeInTheDocument();
  });

  it('calls onChange when change is made(show label)', () => {
    render(<HeatmapLabelVisOptions {...defaultProps} />);
    const reverse = screen.getAllByRole('switch')[0];
    fireEvent.click(reverse);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      show: true,
    });
  });

  it('should show AggregationType when shouldShowType is true', () => {
    const props = {
      shouldShowType: true,
      styles: {
        type: AggregationType.SUM,
        show: true,
        rotate: false,
        overwriteColor: false,
        color: 'black',
      },
      onChange: jest.fn(),
    };
    render(<HeatmapLabelVisOptions {...props} />);
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('toggles rotate label and calls onChange', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        show: true,
      },
    };

    render(<HeatmapLabelVisOptions {...props} />);
    const rotateSwitch = screen.getByTestId('rotateLabel');
    fireEvent.click(rotateSwitch);

    expect(props.onChange).toHaveBeenCalledWith({
      ...props.styles,
      rotate: true,
    });
  });

  it('toggles overwriteColor and shows color picker', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        show: true,
        overwriteColor: false,
      },
    };

    render(<HeatmapLabelVisOptions {...props} />);
    const overwriteSwitch = screen.getByTestId('overwriteColor');
    fireEvent.click(overwriteSwitch);

    expect(props.onChange).toHaveBeenCalledWith({
      ...props.styles,
      overwriteColor: true,
    });
  });

  it('updates color when color picker changes', async () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        show: true,
        overwriteColor: true,
        color: 'black',
      },
    };

    render(<HeatmapLabelVisOptions {...props} />);
    // Find the color picker input
    const colorPicker = screen.getByRole('textbox');
    fireEvent.change(colorPicker, { target: { value: '#ff0000' } });

    await waitFor(() => {
      expect(props.onChange).toHaveBeenCalledWith({
        ...props.styles,
        color: '#ff0000',
      });
    });
  });

  it('changes label type and calls onChange', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        show: true,
        type: AggregationType.SUM,
      },
    };

    render(<HeatmapLabelVisOptions {...props} />);
    const typeSelect = screen.getByRole('combobox');
    fireEvent.change(typeSelect, { target: { value: AggregationType.MEAN } });

    expect(props.onChange).toHaveBeenCalledWith({
      ...props.styles,
      type: AggregationType.MEAN,
    });
  });

  it('does not show label type when shouldShowType is false', () => {
    const props = {
      ...defaultProps,
      shouldShowType: false,
      styles: {
        ...defaultProps.styles,
        show: true,
      },
    };

    render(<HeatmapLabelVisOptions {...props} />);
    expect(screen.queryByText('Type')).not.toBeInTheDocument();
  });
});
