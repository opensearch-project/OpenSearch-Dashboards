/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { EuiButton, EuiButtonIcon, EuiHeaderLink, EuiText, EuiToolTip } from '@elastic/eui';
import { ShallowWrapper } from 'enzyme';
import React from 'react';
import { shallowWithIntl } from '../../../../test_utils/public/enzyme_helpers';
import { TopNavControlData } from './top_nav_control_data';
import { TopNavControlItem } from './top_nav_control_item';

// Mock props for different scenarios
const buttonProps: TopNavControlData = {
  controlType: 'button',
  label: 'Button',
  run: jest.fn(),
};

const linkProps: TopNavControlData = {
  controlType: 'link',
  label: 'Link',
  href: 'http://example.com',
};

const iconProps: TopNavControlData = {
  controlType: 'icon',
  iconType: 'user',
  ariaLabel: 'Icon',
  run: jest.fn(),
};

const textProps: TopNavControlData = {
  text: 'Text Content',
};

const descriptionProps: TopNavControlData = {
  description: 'Description Content',
};

const componentProps: TopNavControlData = {
  renderComponent: <div>Custom Component</div>,
};

describe('TopNavControlItem', () => {
  it('renders a button control', () => {
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...buttonProps} />);
    expect(wrapper.find(EuiButton)).toHaveLength(1);
    expect(wrapper.find(EuiButton).prop('onClick')).toBeDefined();
  });

  it('renders a link control', () => {
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...linkProps} />);
    expect(wrapper.find(EuiHeaderLink)).toHaveLength(1);
    expect(wrapper.find(EuiHeaderLink).prop('href')).toEqual(linkProps.href);
  });

  it('renders an icon control', () => {
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...iconProps} />);
    expect(wrapper.find(EuiButtonIcon)).toHaveLength(1);
    expect(wrapper.find(EuiButtonIcon).prop('iconType')).toEqual(iconProps.iconType);
  });

  it('renders text content', () => {
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...textProps} />);
    expect(wrapper.find(EuiText)).toHaveLength(1);
    expect(wrapper.find(EuiText).children().text()).toEqual(textProps.text);
  });

  it('renders description content', () => {
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...descriptionProps} />);
    expect(wrapper.find(EuiText)).toHaveLength(1);
    expect(wrapper.find(EuiText).children().text()).toEqual(descriptionProps.description);
  });

  it('renders a custom component', () => {
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...componentProps} />);
    expect(wrapper.contains(componentProps.renderComponent)).toBe(true);
  });

  it('handles disabled state correctly', () => {
    const disabledProps = { ...buttonProps, isDisabled: true };
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...disabledProps} />);
    expect(wrapper.find(EuiButton).prop('isDisabled')).toBe(true);
  });

  it('handles tooltip correctly', () => {
    const tooltipProps = { ...buttonProps, tooltip: 'Tooltip text' };
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...tooltipProps} />);
    expect(wrapper.find(EuiToolTip)).toHaveLength(1);
    expect(wrapper.find(EuiToolTip).prop('content')).toEqual('Tooltip text');
  });

  it('calls run function on button click', () => {
    const mockEvent = { currentTarget: document.createElement('button') } as React.MouseEvent<
      HTMLButtonElement
    >;
    const wrapper: ShallowWrapper = shallowWithIntl(<TopNavControlItem {...buttonProps} />);
    wrapper.find(EuiButton).simulate('click', mockEvent);
    expect(buttonProps.run).toHaveBeenCalledWith(mockEvent.currentTarget);
  });
});
