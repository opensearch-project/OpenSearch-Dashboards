/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StateTimeLineExclusiveVisOptions } from './state_timeline_exclusive_vis_options';
import { DisableMode } from '../types';

const mockOnChange = jest.fn();
const mockOnUseThresholdColorChange = jest.fn();

const defaultStyles = {
  showValues: false,
  rowHeight: 1,
  disconnectValues: {
    disableMode: DisableMode.Never,
    threshold: '1h',
  },
  connectNullValues: {
    connectMode: DisableMode.Never,
    threshold: '1h',
  },
};

jest.mock('../style_panel/utils', () => ({
  DebouncedFieldText: jest.fn(({ value, onChange, placeholder, ...rest }) => (
    <input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  )),
  DebouncedFieldNumber: jest.fn(({ value, onChange, placeholder }) => (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder={placeholder}
      data-test-subj="debouncedFieldNumber"
    />
  )),
}));

describe('StateTimeLineExclusiveVisOptions', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all vis controls', () => {
    render(
      <StateTimeLineExclusiveVisOptions
        styles={defaultStyles}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    expect(screen.getByText('Show display text')).toBeInTheDocument();
    expect(screen.getByText('Row height')).toBeInTheDocument();
    expect(screen.getByTestId('connectValuesGroupButton')).toBeInTheDocument();
    expect(screen.getByTestId('disconnectValuesGroupButton')).toBeInTheDocument();
  });

  it('handles show values toggle', () => {
    render(
      <StateTimeLineExclusiveVisOptions
        styles={defaultStyles}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    const toggle = screen.getByTestId('showValuesSwtich');
    fireEvent.click(toggle);

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultStyles,
      showValues: true,
    });
  });

  it('shows threshold input when disconnect values is set to threshold', () => {
    const stylesWithThreshold = {
      ...defaultStyles,
      disconnectValues: {
        disableMode: DisableMode.Threshold,
        threshold: '2h',
      },
    };

    render(
      <StateTimeLineExclusiveVisOptions
        styles={stylesWithThreshold}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    expect(screen.getByTestId('disableValuesThreshold')).toBeInTheDocument();
  });

  it('should not show threshold input when disconnect values is set to never', () => {
    const stylesWithThreshold = {
      ...defaultStyles,
      disconnectValues: {
        disableMode: DisableMode.Never,
        threshold: '2h',
      },
    };

    render(
      <StateTimeLineExclusiveVisOptions
        styles={stylesWithThreshold}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    expect(screen.queryByTestId('disableValuesThreshold')).not.toBeInTheDocument();
  });

  it('shows threshold input when connect null values is set to threshold', () => {
    const stylesWithThreshold = {
      ...defaultStyles,
      connectNullValues: {
        connectMode: DisableMode.Threshold,
        threshold: '2h',
      },
    };

    render(
      <StateTimeLineExclusiveVisOptions
        styles={stylesWithThreshold}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    expect(screen.getByTestId('connectValuesThreshold')).toBeInTheDocument();
  });

  it('should not show threshold input when connect null values is set to never', () => {
    const stylesWithThreshold = {
      ...defaultStyles,
      connectNullValues: {
        connectMode: DisableMode.Never,
        threshold: '2h',
      },
    };

    render(
      <StateTimeLineExclusiveVisOptions
        styles={stylesWithThreshold}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    expect(screen.queryByTestId('connectValuesThreshold')).not.toBeInTheDocument();
  });

  it('disables connect null values when disconnect values is not never', () => {
    const stylesWithDisconnect = {
      ...defaultStyles,
      disconnectValues: {
        disableMode: DisableMode.Threshold,
        threshold: '1h',
      },
    };

    render(
      <StateTimeLineExclusiveVisOptions
        styles={stylesWithDisconnect}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    const connectButtons = screen.getByTestId('connectValuesGroupButton');
    expect(connectButtons).toHaveAttribute('disabled');
  });

  it('able to update threshold values for connect null values', async () => {
    const styles = {
      ...defaultStyles,
      connectNullValues: {
        connectMode: DisableMode.Threshold,
        threshold: '2h',
      },
    };

    render(
      <StateTimeLineExclusiveVisOptions
        styles={styles}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );

    const thresholdInput = screen.getByTestId('connectValuesThreshold');
    fireEvent.change(thresholdInput, { target: { value: '3h' } });
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...styles,
        connectNullValues: {
          connectMode: DisableMode.Threshold,
          threshold: '3h',
        },
      });
    });
  });

  it('able to update row height', async () => {
    render(
      <StateTimeLineExclusiveVisOptions
        styles={defaultStyles}
        onChange={mockOnChange}
        useThresholdColor={false}
        onUseThresholdColorChange={mockOnUseThresholdColorChange}
      />
    );
    const rowHeightInput = screen.getByTestId('debouncedFieldNumber');
    fireEvent.change(rowHeightInput, { target: { value: 0.2 } });
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultStyles,
        rowHeight: 0.2,
      });
    });
  });
});
