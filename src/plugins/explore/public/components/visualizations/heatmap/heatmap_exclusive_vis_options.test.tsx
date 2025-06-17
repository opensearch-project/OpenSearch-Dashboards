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
    expect(screen.getByText('Exclusive Settings')).toBeInTheDocument();
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
    expect(screen.getByText('Label Settings')).toBeInTheDocument();
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
});
