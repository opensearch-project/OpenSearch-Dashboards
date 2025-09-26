/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PieVisStyleControls, PieVisStyleControlsProps } from './pie_vis_options';
import { VisFieldType, AxisRole } from '../types';
import { defaultPieChartStyles } from './pie_vis_config';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

// Mock the AxesSelectPanel component that uses Redux hooks
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

// Mock the LegendOptionsPanel component
jest.mock('../style_panel/legend/legend', () => ({
  LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange }) => (
    <div data-test-subj="legend-panel">
      <div>Legend</div>
      <button
        data-test-subj="legendModeSwitch"
        onClick={() => onLegendOptionsChange(0, { show: !legendOptions[0].show })}
      >
        Toggle Legend
      </button>
    </div>
  )),
}));

// Mock the PieExclusiveVisOptions component
jest.mock('./pie_exclusive_vis_options', () => ({
  PieExclusiveVisOptions: jest.fn(({ styles, onChange }) => (
    <div data-test-subj="pie-exclusive-panel">
      <button aria-label="Show as">Show as</button>
      <button
        data-test-subj="showValuesSwtich"
        onClick={() => onChange({ ...styles, showValues: !styles.showValues })}
      >
        Toggle Show Values
      </button>
    </div>
  )),
}));

// Mock the TooltipOptionsPanel component
jest.mock('../style_panel/tooltip/tooltip', () => ({
  TooltipOptionsPanel: jest.fn(({ tooltipOptions, onTooltipOptionsChange }) => (
    <div data-test-subj="tooltip-panel">
      <button
        data-test-subj="tooltipModeSwitch"
        onClick={() =>
          onTooltipOptionsChange({ mode: tooltipOptions.mode === 'all' ? 'hidden' : 'all' })
        }
      >
        Toggle Tooltip
      </button>
    </div>
  )),
}));

// Mock the TitleOptionsPanel component
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
    // Use a more specific selector to find the accordion header
    expect(screen.getByRole('button', { name: /show as/i })).toBeInTheDocument();
  });

  it('renders the legend options accordion', () => {
    render(<PieVisStyleControls {...mockProps} />);
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('calls onStyleChange with the correct parameters when a legend option changes', () => {
    render(<PieVisStyleControls {...mockProps} />);
    const switchButton = screen.getByTestId('legendModeSwitch');
    fireEvent.click(switchButton);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      legends: [
        {
          ...mockProps.styleOptions.legends[0],
          show: !mockProps.styleOptions.legends[0].show,
        },
      ],
    });
  });

  it('calls onStyleChange when PieExclusiveVisOptions onChange is triggered', () => {
    render(<PieVisStyleControls {...mockProps} />);
    const showValuesSwitch = screen.getByTestId('showValuesSwtich');
    fireEvent.click(showValuesSwitch);
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: { ...mockProps.styleOptions.exclusive, showValues: true },
    });
  });

  it('calls onStyleChange when tooltip options change', () => {
    render(<PieVisStyleControls {...mockProps} />);
    const tooltipSwitch = screen.getByTestId('tooltipModeSwitch');
    fireEvent.click(tooltipSwitch);
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...mockProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  it('does not render style panels when axisColumnMappings is empty', () => {
    render(<PieVisStyleControls {...mockProps} axisColumnMappings={{}} />);
    expect(screen.queryByText('Legend')).not.toBeInTheDocument();
    expect(screen.queryByTestId('showValuesSwtich')).not.toBeInTheDocument();
  });

  it('updates title show option correctly', async () => {
    render(<PieVisStyleControls {...mockProps} />);

    // Find the title switch and toggle it
    const titleSwitch = screen.getByTestId('titleModeSwitch');
    await userEvent.click(titleSwitch);

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...mockProps.styleOptions.titleOptions,
          show: true,
        },
      });
    });
  });

  it('updates title name when text is entered', async () => {
    // Set show to true to ensure the title field is visible
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

    const titleInput = screen.getByPlaceholderText('Default title');
    await userEvent.type(titleInput, 'New Chart Title');

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          titleName: 'New Chart Title',
        },
      });
    });
  });
});
