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

// Mock the CustomRange component
jest.mock('../style_panel/custom_ranges', () => {
  return {
    CustomRange: ({
      customRanges,
      onCustomRangesChange,
    }: {
      customRanges?: Array<{ from?: number; to?: number; color?: string }>;
      onCustomRangesChange: (ranges: Array<{ from?: number; to?: number; color?: string }>) => void;
    }) => (
      <div data-test-subj="custom-ranges">
        <button
          data-test-subj="add-range-button"
          onClick={() =>
            onCustomRangesChange([...(customRanges || []), { from: 0, to: 10, color: '#000000' }])
          }
        >
          Add Range
        </button>
      </div>
    ),
  };
});

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

  it('toggles useCustomRanges and calls onChange', () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    const useCustomRangesSwitch = screen.getByText('Use custom ranges');
    fireEvent.click(useCustomRangesSwitch);

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.styles,
      useCustomRanges: true,
    });
  });

  it('updates maxNumberOfColors and calls onChange after debounce', async () => {
    render(<HeatmapExclusiveVisOptions {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Max number of colors/i);

    fireEvent.change(input, { target: { value: '10' } });

    await waitFor(() => {
      expect(defaultProps.onChange).toHaveBeenCalledWith({
        ...defaultProps.styles,
        maxNumberOfColors: 10,
      });
    });
  });

  it('renders CustomRange component when useCustomRanges is true', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        useCustomRanges: true,
        customRanges: [],
      },
    };

    render(<HeatmapExclusiveVisOptions {...props} />);
    expect(screen.getByTestId('custom-ranges')).toBeInTheDocument();
  });

  it('updates customRanges when CustomRange component triggers change', () => {
    const props = {
      ...defaultProps,
      styles: {
        ...defaultProps.styles,
        useCustomRanges: true,
        customRanges: [],
      },
    };

    render(<HeatmapExclusiveVisOptions {...props} />);
    const addRangeButton = screen.getByTestId('add-range-button');
    fireEvent.click(addRangeButton);

    expect(props.onChange).toHaveBeenCalledWith({
      ...props.styles,
      customRanges: [{ from: 0, to: 10, color: '#000000' }],
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
