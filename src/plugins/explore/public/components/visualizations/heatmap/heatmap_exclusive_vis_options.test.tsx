/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  HeatmapExclusiveVisOptions,
  HeatmapLabelVisOptions,
} from './heatmap_exclusive_vis_options';
import { ColorSchemas, ScaleType, LabelAggregationType } from '../types';

describe('HeatmapExclusiveVisOptions', () => {
  const defaultProps = {
    styles: {
      colorSchema: ColorSchemas.BLUES,
      reverseSchema: false,
      colorScaleType: ScaleType.LINEAR,
      scaleToDataBounds: false,
      percentageMode: false,
      maxNumberOfColors: 4,
      useCustomRanges: false,
    },
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

  it('disables percentageMode switch when useCustomRanges is true', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        useCustomRanges: true,
      },
    };

    render(<HeatmapExclusiveVisOptions {...props} />);
    const switchEl = screen.getByTestId('percentageMode');
    expect(switchEl).toBeDisabled();
  });

  it('disables maxNumberOfColors input when useCustomRanges is true', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        useCustomRanges: true,
      },
    };

    render(<HeatmapExclusiveVisOptions {...props} />);
    const input = screen.getByPlaceholderText(/Max number of colors/i);
    expect(input).toBeDisabled();
  });
});

describe('HeatmapLabelVisOptions', () => {
  const defaultProps = {
    shouldShowType: true,
    styles: {
      type: LabelAggregationType.SUM,
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
    expect(screen.getByText('Labels')).toBeInTheDocument();
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

  it('should show LabelAggregationType when shouldShowType is true', () => {
    const props = {
      shouldShowType: true,
      styles: {
        type: LabelAggregationType.SUM,
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
});
