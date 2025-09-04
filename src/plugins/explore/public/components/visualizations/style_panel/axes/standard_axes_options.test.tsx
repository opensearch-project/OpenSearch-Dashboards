/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AllAxesOptions } from './standard_axes_options';
import { StandardAxes, Positions, AxisRole } from '../../types';
import configureMockStore from 'redux-mock-store';

const mockStore = configureMockStore([]);

const store = mockStore({
  tab: {
    visualizations: {
      styleOptions: {
        switchAxes: false,
      },
    },
  },
});

// Mock the debounced components
jest.mock('../../style_panel/utils', () => ({
  DebouncedFieldNumber: ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (val: number) => void;
  }) => (
    <div>
      <input
        id="truncate-field"
        type="number"
        data-test-subj="truncate-field"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  ),
  DebouncedFieldText: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }) => (
    <div>
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
      grid: {
        showLines: true,
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
      grid: {
        showLines: true,
      },
      axisRole: AxisRole.Y,
    },
  ];

  const defaultProps = {
    standardAxes: mockStandardAxes,
    onStandardAxesChange: jest.fn(),
    onChangeSwitchAxes: jest.fn(),
    disableGrid: false,
    axisColumnMappings: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders axis section', () => {
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('should switch label is switchAxes is true', () => {
    const switchStore = mockStore({
      tab: {
        visualizations: {
          styleOptions: {
            switchAxes: true,
          },
        },
      },
    });

    render(
      <Provider store={switchStore}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );
  });
  it('shows/hides label options based on show labels toggle', () => {
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );

    expect(screen.getAllByText('Alignment')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Truncate after')[0]).toBeInTheDocument();

    const showLabelsSwitch = screen.getAllByTestId('showAxisSwitch')[0];
    fireEvent.click(showLabelsSwitch);

    expect(defaultProps.onStandardAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          show: false,
        }),
      ])
    );
  });

  it('updates axis position when changed', () => {
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );

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

  it('updates axis title', async () => {
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );

    // Find the title input and change it
    const titleInput = screen.getAllByTestId('text-field')[0];
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
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );

    // Find the show labels switch by its text content and toggle it
    const showLabelsSwitch = screen.getAllByText('Show labels')[0];
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
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );

    // Find the alignment select and change it to vertical
    const alignmentSelect = screen.getAllByRole('combobox')[0];
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
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );

    // Find the alignment select and change it to angled
    const alignmentSelect = screen.getAllByRole('combobox')[0];
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
    render(
      <Provider store={store}>
        <AllAxesOptions {...defaultProps} />
      </Provider>
    );

    // Find the truncate input and change it
    const truncateInput = screen.getAllByTestId('truncate-field')[0];
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
});
