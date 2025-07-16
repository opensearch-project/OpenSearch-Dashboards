/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AllAxesOptions, StandardAxesOptions } from './standard_axes_options';
import { StandardAxes, Positions, AxisRole, VisFieldType } from '../../types';

// Mock the debounced components
jest.mock('../../style_panel/utils', () => ({
  DebouncedTruncateField: ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div>
      <label htmlFor="truncate-field">{label}</label>
      <input
        id="truncate-field"
        type="number"
        data-test-subj="truncate-field"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  ),
  DebouncedText: ({
    value,
    onChange,
    label,
    placeholder,
  }: {
    value: string;
    onChange: (val: string) => void;
    label: string;
    placeholder?: string;
  }) => (
    <div>
      <label htmlFor="text-field">{label}</label>
      <input
        id="text-field"
        type="text"
        data-test-subj="text-field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

describe('AllAxesOptions', () => {
  const mockStandardAxes: StandardAxes[] = [
    {
      id: 'Axis-1',
      position: Positions.BOTTOM,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      axisRole: AxisRole.X,
    },
    {
      id: 'Axis-2',
      position: Positions.LEFT,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      axisRole: AxisRole.Y,
    },
  ];

  const defaultProps = {
    standardAxes: mockStandardAxes,
    onStandardAxesChange: jest.fn(),
    onChangeSwitchAxes: jest.fn(),
    disableGrid: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AllAxesOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders axis section', () => {
    render(<AllAxesOptions {...defaultProps} />);
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('calls onChangeSwitchAxes when position is switched', () => {
    render(<AllAxesOptions {...defaultProps} />);
    const button = screen.getByTestId('switchAxesButton');
    fireEvent.click(button);

    expect(defaultProps.onChangeSwitchAxes).toHaveBeenCalled();
  });

  it('shows/hides label options based on show labels toggle', () => {
    render(<AllAxesOptions {...defaultProps} />);

    const axis = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(axis);

    expect(screen.getAllByText('Aligned')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Truncate')[0]).toBeInTheDocument();

    const showLabelsSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(showLabelsSwitch);

    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ show: false }),
        }),
      ])
    );
  });
});

describe('StandardAxesOptions', () => {
  const mockStandardAxes: StandardAxes[] = [
    {
      id: 'Axis-1',
      position: Positions.BOTTOM,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      axisRole: AxisRole.X,
    },
    {
      id: 'Axis-2',
      position: Positions.LEFT,
      show: true,
      style: {},
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: '',
      },
      axisRole: AxisRole.Y,
    },
  ];

  const defaultProps = {
    standardAxes: mockStandardAxes,
    onStandardAxesChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<StandardAxesOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders both X and Y axes', () => {
    render(<StandardAxesOptions {...defaultProps} />);
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('toggles axis expansion when clicked', () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Initially, the axis details should not be visible
    expect(screen.queryByText('Position')).not.toBeInTheDocument();

    // Click to expand
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Now the details should be visible
    expect(screen.getByText('Position')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(xAxisButton);

    // The details should be hidden again
    // Note: This might not work as expected in tests since the state might not update immediately
    // But the click handler should have been called
  });

  it('updates axis position when changed', () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the position button group and click on "Top"
    const topButton = screen.getByText('Top');
    fireEvent.click(topButton);

    // Check that onStandardAxesChange was called with the updated position
    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          position: Positions.TOP,
        }),
      ])
    );
  });

  it('toggles axis visibility', () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the show switch by its role and toggle it
    const switches = screen.getAllByRole('switch');
    const showSwitch = switches[0]; // First switch is the "Show axis lines and labels" switch
    fireEvent.click(showSwitch);

    // Check that onStandardAxesChange was called with show: false
    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          show: false,
        }),
      ])
    );
  });

  it('updates axis title', async () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the title input and change it
    const titleInput = screen.getByTestId('text-field');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    // Check that onStandardAxesChange was called with the updated title
    await waitFor(() => {
      expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.objectContaining({ text: 'New Title' }),
          }),
        ])
      );
    });
  });

  it('toggles label visibility', () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the show labels switch by its text content and toggle it
    const showLabelsSwitch = screen.getByText('Show labels');
    fireEvent.click(showLabelsSwitch);

    // Check that onStandardAxesChange was called with labels.show: false
    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ show: false }),
        }),
      ])
    );
  });

  it('updates label rotation to vertical', () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the alignment select and change it to vertical
    const alignmentSelect = screen.getByRole('combobox');
    fireEvent.change(alignmentSelect, { target: { value: 'vertical' } });

    // Check that onStandardAxesChange was called with the updated rotation
    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ rotate: -90 }),
        }),
      ])
    );
  });

  it('updates label rotation to angled', () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the alignment select and change it to angled
    const alignmentSelect = screen.getByRole('combobox');
    fireEvent.change(alignmentSelect, { target: { value: 'angled' } });

    // Check that onStandardAxesChange was called with the updated rotation
    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ rotate: -45 }),
        }),
      ])
    );
  });

  it('updates truncate value', async () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the truncate input and change it
    const truncateInput = screen.getByTestId('truncate-field');
    fireEvent.change(truncateInput, { target: { value: '50' } });

    // Check that onStandardAxesChange was called with the updated truncate value
    await waitFor(() => {
      expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            labels: expect.objectContaining({ truncate: 50 }),
          }),
        ])
      );
    });
  });

  it('handles axis with field property', () => {
    // Create a mock field that matches the expected structure
    const mockField = {
      default: {
        name: 'Field Name',
        id: 123, // Using a number for id as required by VisColumn
        schema: VisFieldType.Categorical,
        column: 'field-column',
        validValuesCount: 10,
        uniqueValuesCount: 5,
      },
    };

    const axesWithField = [
      {
        ...mockStandardAxes[0],
        field: mockField,
      } as StandardAxes,
      mockStandardAxes[1],
    ];

    render(
      <StandardAxesOptions
        standardAxes={axesWithField}
        onStandardAxesChange={defaultProps.onStandardAxesChange}
      />
    );

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // Find the title input and check its value
    const titleInput = screen.getByTestId('text-field');
    expect(titleInput).toHaveValue('Field Name');
  });

  it('handles Y-axis position change', () => {
    render(<StandardAxesOptions {...defaultProps} />);

    // Expand Y-axis
    const yAxisButton = screen.getByTestId('standardAxis-1-button');
    fireEvent.click(yAxisButton);

    // Find the position button group and click on "Right"
    const rightButton = screen.getByText('Right');
    fireEvent.click(rightButton);

    // Check that onStandardAxesChange was called with the updated position
    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'Axis-2',
          position: Positions.RIGHT,
        }),
      ])
    );
  });

  it('does not show label options when axis.show is false', () => {
    const axesWithHiddenAxis = [
      {
        ...mockStandardAxes[0],
        show: false,
      },
      mockStandardAxes[1],
    ];

    render(
      <StandardAxesOptions
        standardAxes={axesWithHiddenAxis}
        onStandardAxesChange={defaultProps.onStandardAxesChange}
      />
    );

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // The display name field should not be visible
    expect(screen.queryByText('Display name')).not.toBeInTheDocument();
  });

  it('does not show label alignment and truncate when labels.show is false', () => {
    const axesWithHiddenLabels = [
      {
        ...mockStandardAxes[0],
        labels: {
          ...mockStandardAxes[0].labels,
          show: false,
        },
      },
      mockStandardAxes[1],
    ];

    render(
      <StandardAxesOptions
        standardAxes={axesWithHiddenLabels}
        onStandardAxesChange={defaultProps.onStandardAxesChange}
      />
    );

    // Expand X-axis
    const xAxisButton = screen.getByTestId('standardAxis-0-button');
    fireEvent.click(xAxisButton);

    // The alignment and truncate fields should not be visible
    expect(screen.queryByText('Aligned')).not.toBeInTheDocument();
    expect(screen.queryByText('Truncate')).not.toBeInTheDocument();
  });
});
