/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';
import { act } from 'react-dom/test-utils';

// Mock the debounced value hook
jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumericValue: jest.fn((value, onChange, options) => {
    return [value, (newValue: string) => onChange(parseFloat(newValue))];
  }),
}));

describe('BarExclusiveVisOptions', () => {
  const defaultProps = {
    barWidth: 0.7,
    barPadding: 0.1,
    showBarBorder: false,
    barBorderWidth: 1,
    barBorderColor: '#000000',
    onBarWidthChange: jest.fn(),
    onBarPaddingChange: jest.fn(),
    onShowBarBorderChange: jest.fn(),
    onBarBorderWidthChange: jest.fn(),
    onBarBorderColorChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    const wrapper = mount(<BarExclusiveVisOptions {...defaultProps} />);

    // Check if the component renders
    expect(wrapper.exists()).toBe(true);

    // Check if the bar width input exists with correct value
    const barWidthInput = wrapper.find('[data-test-subj="barWidthInput"]').first();
    expect(barWidthInput.exists()).toBe(true);
    expect(barWidthInput.prop('value')).toBe(0.7);

    // Check if the bar padding input exists with correct value
    const barPaddingInput = wrapper.find('[data-test-subj="barPaddingInput"]').first();
    expect(barPaddingInput.exists()).toBe(true);
    expect(barPaddingInput.prop('value')).toBe(0.1);

    // Check if the show bar border switch exists with correct value
    const showBarBorderSwitch = wrapper.find('[data-test-subj="showBarBorderSwitch"]').first();
    expect(showBarBorderSwitch.exists()).toBe(true);
    expect(showBarBorderSwitch.prop('checked')).toBe(false);

    // Border options should not be visible when showBarBorder is false
    expect(wrapper.find('[data-test-subj="barBorderWidthInput"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-subj="barBorderColorPicker"]').exists()).toBe(false);
  });

  test('shows border options when showBarBorder is true', () => {
    const wrapper = mount(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // Border options should be visible when showBarBorder is true
    expect(wrapper.find('[data-test-subj="barBorderWidthInput"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-subj="barBorderColorPicker"]').exists()).toBe(true);

    // Check if the border width input has the correct value
    const barBorderWidthInput = wrapper.find('[data-test-subj="barBorderWidthInput"]').first();
    expect(barBorderWidthInput.prop('value')).toBe(1);
  });

  test('calls onBarWidthChange when bar width is changed', () => {
    const wrapper = mount(<BarExclusiveVisOptions {...defaultProps} />);

    // Simulate changing the bar width
    const barWidthInput = wrapper.find('[data-test-subj="barWidthInput"]').first();
    const onChangeProp = barWidthInput.prop('onChange');
    if (onChangeProp) {
      act(() => {
        onChangeProp({ target: { value: '0.8' } } as React.ChangeEvent<HTMLInputElement>);
      });
    }

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarWidthChange).toHaveBeenCalledWith(0.8);
  });

  test('calls onBarPaddingChange when bar padding is changed', () => {
    const wrapper = mount(<BarExclusiveVisOptions {...defaultProps} />);

    // Simulate changing the bar padding
    const barPaddingInput = wrapper.find('[data-test-subj="barPaddingInput"]').first();
    const onChangeProp = barPaddingInput.prop('onChange');
    if (onChangeProp) {
      act(() => {
        onChangeProp({ target: { value: '0.2' } } as React.ChangeEvent<HTMLInputElement>);
      });
    }

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarPaddingChange).toHaveBeenCalledWith(0.2);
  });

  test('calls onShowBarBorderChange when show bar border is toggled', () => {
    const wrapper = mount(<BarExclusiveVisOptions {...defaultProps} />);

    // Simulate toggling the show bar border switch
    const showBarBorderSwitch = wrapper.find('[data-test-subj="showBarBorderSwitch"]').first();
    const onChangeProp = showBarBorderSwitch.prop('onChange');
    if (onChangeProp) {
      act(() => {
        onChangeProp({ target: { checked: true } } as React.ChangeEvent<HTMLInputElement>);
      });
    }

    // Check if the callback was called with the correct value
    expect(defaultProps.onShowBarBorderChange).toHaveBeenCalledWith(true);
  });

  test('calls onBarBorderWidthChange when border width is changed', () => {
    const wrapper = mount(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // Simulate changing the border width
    const barBorderWidthInput = wrapper.find('[data-test-subj="barBorderWidthInput"]').first();
    const onChangeProp = barBorderWidthInput.prop('onChange');
    if (onChangeProp) {
      act(() => {
        onChangeProp({ target: { value: '2' } } as React.ChangeEvent<HTMLInputElement>);
      });
    }

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarBorderWidthChange).toHaveBeenCalledWith(2);
  });

  test('calls onBarBorderColorChange when border color is changed', () => {
    const wrapper = mount(<BarExclusiveVisOptions {...defaultProps} showBarBorder={true} />);

    // Simulate changing the border color
    const barBorderColorPicker = wrapper.find('[data-test-subj="barBorderColorPicker"]').first();
    const onChangeProp = barBorderColorPicker.prop('onChange');
    if (onChangeProp) {
      act(() => {
        // The EuiColorPicker component expects a string color value
        // TypeScript doesn't know this is a special case
        (onChangeProp as any)('#FF0000');
      });
    }

    // Check if the callback was called with the correct value
    expect(defaultProps.onBarBorderColorChange).toHaveBeenCalledWith('#FF0000');
  });
});
