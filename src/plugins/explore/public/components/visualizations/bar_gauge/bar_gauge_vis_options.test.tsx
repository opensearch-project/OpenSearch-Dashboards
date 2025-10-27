/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { BarGaugeVisStyleControls, BarGaugeVisStyleControlsProps } from './bar_gauge_vis_options';
import { defaultBarGaugeChartStyles } from './bar_gauge_vis_config';
import { VisColumn, VisFieldType, AxisRole, AxisColumnMappings } from '../types';

const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'value',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];
const mockCategoricalColumns: VisColumn[] = [
  {
    id: 2,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  },
];

const mockAxisColumnMappings: AxisColumnMappings = {
  [AxisRole.X]: mockCategoricalColumns[0],
  [AxisRole.Y]: mockNumericalColumns[0],
};

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('../style_panel/threshold/threshold_panel', () => ({
  ThresholdPanel: jest.fn(({ thresholdsOptions, onChange }) => (
    <div data-test-subj="mockThresholdOptions">
      <button
        data-test-subj="mockUpdateThreshold"
        onClick={() =>
          onChange({ ...thresholdsOptions, thresholds: [{ value: 50, color: '#FF0000' }] })
        }
      >
        Update Threshold
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/tooltip/tooltip', () => ({
  TooltipOptionsPanel: jest.fn(({ tooltipOptions, onTooltipOptionsChange }) => (
    <div data-test-subj="mockTooltipOptionsPanel">
      <button
        data-test-subj="mockUpdateTooltip"
        onClick={() => onTooltipOptionsChange({ mode: 'hidden' })}
      >
        Update Tooltip
      </button>
    </div>
  )),
}));

jest.mock('./bar_gauge_exclusive_vis_options', () => ({
  BarGaugeExclusiveVisOptions: jest.fn(({ onChange }) => (
    <div data-test-subj="mockBarGaugeExclusiveVisOptions">
      <button
        data-test-subj="mockUpdateOrientation"
        onClick={() => onChange({ orientation: 'vertical' })}
      >
        Update Orientation
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/value/value_calculation_selector', () => ({
  ValueCalculationSelector: jest.fn(({ onChange }) => (
    <div data-test-subj="mockValueCalculationSelector">
      <button data-test-subj="mockUpdateCalculation" onClick={() => onChange('mean')}>
        Update Calculation
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/style_accordion', () => ({
  StyleAccordion: jest.fn(({ children }) => (
    <div data-test-subj="mockStyleAccordion">{children}</div>
  )),
}));

jest.mock('../style_panel/standard_options/standard_options_panel', () => ({
  StandardOptionsPanel: jest.fn(({ onMinChange, onMaxChange }) => (
    <div data-test-subj="mockStandardOptionsPanel">
      <button data-test-subj="mockUpdateMin" onClick={() => onMinChange(10)}>
        Update Min
      </button>
      <button data-test-subj="mockUpdateMax" onClick={() => onMaxChange(100)}>
        Update Max
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/title/title', () => ({
  TitleOptionsPanel: jest.fn(({ titleOptions, onShowTitleChange }) => (
    <div data-test-subj="mockTitleOptionsPanel">
      <button
        data-test-subj="mockTitleModeSwitch"
        onClick={() => onShowTitleChange({ show: !titleOptions.show })}
      >
        Toggle Title
      </button>
      <input
        data-test-subj="mockTitleInput"
        placeholder="Default title"
        onChange={(e) => onShowTitleChange({ titleName: e.target.value })}
      />
    </div>
  )),
}));

describe('BarGaugeVisStyleControls', () => {
  const defaultProps: BarGaugeVisStyleControlsProps = {
    styleOptions: {
      ...defaultBarGaugeChartStyles,
      titleOptions: {
        show: true,
        titleName: '',
      },
    },
    onStyleChange: jest.fn(),
    numericalColumns: mockNumericalColumns,
    categoricalColumns: mockCategoricalColumns,
    dateColumns: [],
    axisColumnMappings: mockAxisColumnMappings,
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render style panels when axis mappings are selected', () => {
    const { getByTestId } = render(<BarGaugeVisStyleControls {...defaultProps} />);

    expect(getByTestId('mockThresholdOptions')).toBeInTheDocument();
    expect(getByTestId('mockStandardOptionsPanel')).toBeInTheDocument();
    expect(getByTestId('mockBarGaugeExclusiveVisOptions')).toBeInTheDocument();
    expect(getByTestId('mockTitleOptionsPanel')).toBeInTheDocument();
    expect(getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
  });

  it('should call onStyleChange when threshold is updated', () => {
    const { getByTestId } = render(<BarGaugeVisStyleControls {...defaultProps} />);

    fireEvent.click(getByTestId('mockUpdateThreshold'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      thresholdOptions: {
        ...defaultProps.styleOptions.thresholdOptions,
        thresholds: [{ value: 50, color: '#FF0000' }],
      },
    });
  });

  it('should call onStyleChange when title options are updated', () => {
    const { getByTestId } = render(<BarGaugeVisStyleControls {...defaultProps} />);

    fireEvent.click(getByTestId('mockTitleModeSwitch'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      titleOptions: {
        ...defaultProps.styleOptions.titleOptions,
        show: !defaultProps.styleOptions.titleOptions.show,
      },
    });
  });

  it('should call onStyleChange when tooltip options are updated', () => {
    const { getByTestId } = render(<BarGaugeVisStyleControls {...defaultProps} />);

    fireEvent.click(getByTestId('mockUpdateTooltip'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: {
        ...defaultProps.styleOptions.tooltipOptions,
        mode: 'hidden',
      },
    });
  });

  it('should call onStyleChange when min/max values are updated', () => {
    const { getByTestId } = render(<BarGaugeVisStyleControls {...defaultProps} />);

    fireEvent.click(getByTestId('mockUpdateMin'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ min: 10 });

    fireEvent.click(getByTestId('mockUpdateMax'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ max: 100 });
  });

  it('should call onStyleChange when orientation options are updated', () => {
    const { getByTestId } = render(<BarGaugeVisStyleControls {...defaultProps} />);

    fireEvent.click(getByTestId('mockUpdateOrientation'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        orientation: 'vertical',
      },
    });
  });
});
