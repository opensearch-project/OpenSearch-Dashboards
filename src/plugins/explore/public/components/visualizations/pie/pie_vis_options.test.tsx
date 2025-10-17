/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PieVisStyleControls, PieVisStyleControlsProps } from './pie_vis_options';
import { VisFieldType, AxisRole } from '../types';
import { defaultPieChartStyles } from './pie_vis_config';

// Mock Positions enum to avoid out-of-scope variable error in jest.mock
const mockPositions = {
  BOTTOM: 'bottom',
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
} as const;

// Mock i18n
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

// Mock child components
jest.mock('../style_panel/axes/axes_selector', () => ({
  AxesSelectPanel: jest.fn(({ updateVisualization, chartType, currentMapping }) => (
    <div data-test-subj="mockAxesSelectPanel">
      <div data-test-subj="chartType">{chartType}</div>
      <button
        data-test-subj="mockUpdateVisualization"
        onClick={() => updateVisualization({ mappings: { size: 'value', color: 'category' } })}
      >
        Update Visualization
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/legend/legend', () => ({
  LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange }) => (
    <div data-test-subj="mockLegendOptionsPanel">
      <button
        data-test-subj="legendModeSwitch"
        onClick={() => onLegendOptionsChange({ show: !legendOptions.show })}
      >
        Toggle Legend
      </button>
      <button
        data-test-subj="legendPositionButton"
        onClick={() => onLegendOptionsChange({ position: mockPositions.BOTTOM })}
      >
        Change Position
      </button>
      <input
        data-test-subj="legendTitleInput"
        placeholder="Legend Title"
        onChange={(e) => onLegendOptionsChange({ title: e.target.value })}
      />
    </div>
  )),
}));

jest.mock('../style_panel/tooltip/tooltip', () => ({
  TooltipOptionsPanel: jest.fn(({ tooltipOptions, onTooltipOptionsChange }) => (
    <div data-test-subj="mockTooltipOptionsPanel">
      <button
        data-test-subj="tooltipModeSwitch"
        onClick={() => onTooltipOptionsChange({ mode: 'hidden' })}
      >
        Toggle Tooltip
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/title/title', () => ({
  TitleOptionsPanel: jest.fn(({ titleOptions, onShowTitleChange }) => (
    <div data-test-subj="mockTitleOptionsPanel">
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

jest.mock('./pie_exclusive_vis_options', () => ({
  PieExclusiveVisOptions: jest.fn(({ styles, onChange }) => (
    <div data-test-subj="mockPieExclusiveVisOptions">
      <button
        data-test-subj="showValuesSwitch"
        onClick={() => onChange({ ...styles, showValues: !styles.showValues })}
      >
        Toggle Show Values
      </button>
    </div>
  )),
}));

describe('PieVisStyleControls', () => {
  const numericalColumn = {
    id: 1,
    name: 'value',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const categoricalColumn = {
    id: 2,
    name: 'category',
    schema: VisFieldType.Categorical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const mockProps: PieVisStyleControlsProps = {
    axisColumnMappings: {
      [AxisRole.SIZE]: numericalColumn,
      [AxisRole.COLOR]: categoricalColumn,
    },
    updateVisualization: jest.fn(),
    styleOptions: defaultPieChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: [numericalColumn],
    categoricalColumns: [categoricalColumn],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the pie exclusive options accordion', () => {
    render(<PieVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('mockPieExclusiveVisOptions')).toBeInTheDocument();
  });

  it('renders the legend options accordion', () => {
    render(<PieVisStyleControls {...mockProps} />);
    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  it('calls onStyleChange with the correct parameters when a legend option changes', async () => {
    render(<PieVisStyleControls {...mockProps} />);

    // Test legend show toggle
    await userEvent.click(screen.getByTestId('legendModeSwitch'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });

    // Test legend position change
    await userEvent.click(screen.getByTestId('legendPositionButton'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: mockPositions.BOTTOM });

    // Test legend title change
    const legendTitleInput = screen.getByTestId('legendTitleInput');
    await userEvent.type(legendTitleInput, 'New Legend Title');
    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({ legendTitle: 'New Legend Title' });
    });
  });

  it('calls onStyleChange when PieExclusiveVisOptions onChange is triggered', async () => {
    render(<PieVisStyleControls {...mockProps} />);
    await userEvent.click(screen.getByTestId('showValuesSwitch'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: { ...mockProps.styleOptions.exclusive, showValues: true },
    });
  });

  it('calls onStyleChange when tooltip options change', async () => {
    render(<PieVisStyleControls {...mockProps} />);
    await userEvent.click(screen.getByTestId('tooltipModeSwitch'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...mockProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  it('does not render style panels when axisColumnMappings is empty', () => {
    render(<PieVisStyleControls {...mockProps} axisColumnMappings={{}} />);
    expect(screen.queryByTestId('mockLegendOptionsPanel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockPieExclusiveVisOptions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockTooltipOptionsPanel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mockTitleOptionsPanel')).not.toBeInTheDocument();
  });

  it('updates title show option correctly', async () => {
    const props = {
      ...mockProps,
      styleOptions: {
        ...mockProps.styleOptions,
        titleOptions: {
          show: false,
          titleName: '',
        },
      },
    };

    render(<PieVisStyleControls {...props} />);
    await userEvent.click(screen.getByTestId('titleModeSwitch'));
    await waitFor(() => {
      expect(props.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          show: true,
        },
      });
    });
  });

  it('updates title name when text is entered', async () => {
    const props = {
      ...mockProps,
      styleOptions: {
        ...mockProps.styleOptions,
        titleOptions: {
          show: true,
          titleName: '',
        },
      },
    };

    render(<PieVisStyleControls {...props} />);
    const titleInput = screen.getByTestId('titleInput');
    await userEvent.type(titleInput, 'New Chart Title');
    await waitFor(() => {
      expect(props.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          titleName: 'New Chart Title',
        },
      });
    });
  });
});
