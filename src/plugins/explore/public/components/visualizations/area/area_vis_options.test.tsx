/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreaVisStyleControls } from './area_vis_options';
import {
  Positions,
  ThresholdMode,
  VisFieldType,
  TooltipOptions,
  AxisRole,
  AxisColumnMappings,
} from '../types';

// Mock child components
jest.mock('../style_panel/axes/axes_selector', () => ({
  AxesSelectPanel: jest.fn(({ updateVisualization }) => (
    <div data-test-subj="axes-select-panel">
      <button
        data-test-subj="update-mapping"
        onClick={() => {
          const mockVisColumn = {
            id: 1,
            name: 'Date',
            schema: 'date',
            column: 'date',
            validValuesCount: 100,
            uniqueValuesCount: 50,
          };
          updateVisualization({ x: mockVisColumn });
        }}
      >
        Update Mapping
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/legend/legend', () => ({
  LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange }) => (
    <div data-test-subj="legend-panel">
      <button
        data-test-subj="toggle-legend"
        onClick={() => onLegendOptionsChange({ show: !legendOptions.show })}
      >
        Toggle Legend
      </button>
      <button
        data-test-subj="change-position"
        onClick={() => onLegendOptionsChange({ position: 'bottom' })}
      >
        Change Position
      </button>
      <button
        data-test-subj="change-both"
        onClick={() => onLegendOptionsChange({ show: !legendOptions.show, position: 'top' })}
      >
        Change Both
      </button>
      <input
        data-test-subj="legend-title-input"
        placeholder="Legend Title"
        onChange={(e) => onLegendOptionsChange({ title: e.target.value })}
      />
    </div>
  )),
}));

jest.mock('../style_panel/threshold/threshold_panel', () => ({
  ThresholdPanel: jest.fn(({ thresholdsOptions, onChange }) => (
    <>
      <div data-test-subj="mockAreaThresholdPanel">
        <button
          data-test-subj="mockAddRange"
          onClick={() =>
            onChange({ ...thresholdsOptions, thresholds: [{ value: 50, color: '#FF0000' }] })
          }
        >
          Add Range
        </button>
      </div>
    </>
  )),
}));

jest.mock('../style_panel/tooltip/tooltip', () => ({
  TooltipOptionsPanel: jest.fn(({ tooltipOptions, onTooltipOptionsChange }) => (
    <div data-test-subj="tooltip-panel">
      <button
        data-test-subj="update-tooltip"
        onClick={() => onTooltipOptionsChange({ mode: 'hidden' as TooltipOptions['mode'] })}
      >
        Update Tooltip
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/title/title', () => ({
  TitleOptionsPanel: jest.fn(({ titleOptions, onShowTitleChange }) => (
    <div data-test-subj="title-panel">
      <button
        data-test-subj="titleModeSwitch"
        onClick={() => onShowTitleChange({ show: !titleOptions.show })}
      >
        Toggle Title
      </button>
      <input
        data-test-subj="titleInput"
        placeholder="Default title"
        onChange={(e) => onShowTitleChange({ titleName: e.target.value })}
      />
    </div>
  )),
}));

describe('AreaVisStyleControls', () => {
  const defaultProps = {
    styleOptions: {
      addLegend: true,
      legendPosition: Positions.RIGHT,
      legendTitle: '',
      addTimeMarker: false,
      // Threshold options
      thresholdOptions: {
        baseColor: '#00BD6B',
        thresholds: [],
        thresholdStyle: ThresholdMode.Solid,
      },
      tooltipOptions: { mode: 'all' as TooltipOptions['mode'] },
      standardAxes: [
        {
          type: 'category' as const,
          position: Positions.BOTTOM as Positions.TOP | Positions.BOTTOM,
          show: true,
          labels: {
            show: true,
            filter: true,
            rotate: 0,
            truncate: 100,
          },
          grid: {
            showLines: true,
          },
          title: {
            text: '',
          },
          axisRole: AxisRole.X,
        },
        {
          type: 'value' as const,
          position: Positions.LEFT as Positions.LEFT | Positions.RIGHT,
          show: true,
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          grid: {
            showLines: true,
          },
          title: {
            text: '',
          },
          axisRole: AxisRole.Y,
        },
      ],
      titleOptions: {
        show: true,
        titleName: '',
      },
      showFullTimeRange: false,
    },
    onStyleChange: jest.fn(),
    axisColumnMappings: {
      [AxisRole.X]: {
        id: 1,
        name: 'Date',
        schema: VisFieldType.Date,
        column: 'date',
        validValuesCount: 100,
        uniqueValuesCount: 50,
      },
      [AxisRole.Y]: {
        id: 2,
        name: 'Count',
        schema: VisFieldType.Numerical,
        column: 'count',
        validValuesCount: 100,
        uniqueValuesCount: 50,
      },
      [AxisRole.COLOR]: {
        id: 3,
        name: 'Category',
        schema: VisFieldType.Categorical,
        column: 'category',
        validValuesCount: 10,
        uniqueValuesCount: 5,
      },
    },
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all panels correctly when mappings are provided', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    expect(screen.getByTestId('legend-panel')).toBeInTheDocument();
    expect(screen.getByTestId('mockAreaThresholdPanel')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-panel')).toBeInTheDocument();
    expect(screen.getByTestId('title-panel')).toBeInTheDocument();
  });

  test('shows legend when COLOR mapping is present', () => {
    const props = {
      ...defaultProps,
      axisColumnMappings: {
        ...defaultProps.axisColumnMappings,
        [AxisRole.COLOR]: {
          id: 3,
          name: 'Category',
          schema: VisFieldType.Categorical,
          column: 'category',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      },
    };

    render(<AreaVisStyleControls {...props} />);

    expect(screen.getByTestId('legend-panel')).toBeInTheDocument();
  });

  test('shows legend when FACET mapping is present', () => {
    const props = {
      ...defaultProps,
      styleOptions: {
        ...defaultProps.styleOptions,
        showFullTimeRange: false,
      },
      axisColumnMappings: {
        ...defaultProps.axisColumnMappings,
        [AxisRole.FACET]: {
          id: 4,
          name: 'Facet',
          schema: VisFieldType.Categorical,
          column: 'facet',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      },
    };

    render(<AreaVisStyleControls {...props} />);

    expect(screen.getByTestId('legend-panel')).toBeInTheDocument();
  });

  test('hides legend when no COLOR or FACET mappings are present', () => {
    const props = {
      ...defaultProps,
      axisColumnMappings: {
        [AxisRole.X]: defaultProps.axisColumnMappings[AxisRole.X],
        [AxisRole.Y]: defaultProps.axisColumnMappings[AxisRole.Y],
      },
    };

    render(<AreaVisStyleControls {...props} />);

    const legendPanel = screen.queryByTestId('legend-panel');
    expect(legendPanel).not.toBeInTheDocument();
  });

  test('updates legend show option correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('toggle-legend'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });
  });

  test('updates legend position correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('change-position'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: Positions.BOTTOM });
  });

  test('updates both legend show and position correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('change-both'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: Positions.TOP });
  });

  test('updates legend title correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    const legendTitleInput = screen.getByTestId('legend-title-input');
    await userEvent.type(legendTitleInput, 'New Legend Title');

    await waitFor(() => {
      expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ legendTitle: 'New Legend Title' });
    });
  });

  test('adds threshold lines correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('mockAddRange'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      thresholdOptions: {
        ...defaultProps.styleOptions.thresholdOptions,
        thresholds: [{ color: '#FF0000', value: 50 }],
      },
    });
  });

  test('updates tooltip options correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('update-tooltip'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...defaultProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  test('does not render style panels when no mappings are selected', () => {
    const props = {
      ...defaultProps,
      axisColumnMappings: {} as AxisColumnMappings,
    };

    render(<AreaVisStyleControls {...props} />);

    // Only the axes select panel should be rendered
    expect(screen.getByTestId('axes-select-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('legend-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockAreaThresholdPanel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tooltip-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('axes-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('title-panel')).not.toBeInTheDocument();
  });

  test('handles empty arrays for columns', () => {
    const props = {
      ...defaultProps,
      numericalColumns: undefined,
      categoricalColumns: undefined,
      dateColumns: undefined,
    };

    expect(() => render(<AreaVisStyleControls {...props} />)).not.toThrow();
  });

  test('updates visualization when mapping is changed', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('update-mapping'));

    expect(defaultProps.updateVisualization).toHaveBeenCalledWith({
      x: {
        id: 1,
        name: 'Date',
        schema: 'date',
        column: 'date',
        validValuesCount: 100,
        uniqueValuesCount: 50,
      },
    });
  });

  test('handles missing optional props', () => {
    const props = {
      ...defaultProps,
      availableChartTypes: undefined,
      selectedChartType: undefined,
      onChartTypeChange: undefined,
    };

    expect(() => render(<AreaVisStyleControls {...props} />)).not.toThrow();
  });

  test('updates title show option correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('titleModeSwitch'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      titleOptions: {
        ...defaultProps.styleOptions.titleOptions,
        show: false,
      },
    });
  });

  test('updates title name when text is entered', async () => {
    const props = {
      ...defaultProps,
      styleOptions: {
        ...defaultProps.styleOptions,
        titleOptions: {
          show: true,
          titleName: '',
        },
      },
    };

    render(<AreaVisStyleControls {...props} />);

    const titleInput = screen.getByTestId('titleInput');
    await userEvent.type(titleInput, 'New Chart Title');

    await waitFor(() => {
      expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          titleName: 'New Chart Title',
        },
      });
    });
  });

  test('updates showFullTimeRange correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('showFullTimeRangeSwitch'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      showFullTimeRange: true, // Default is false, so toggling sets it to true
    });
  });
});
