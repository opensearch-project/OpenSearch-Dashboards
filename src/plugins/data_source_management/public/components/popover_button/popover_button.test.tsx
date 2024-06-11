/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { DataSourceMenuPopoverButton } from './popover_button';

describe('Test on PopoverButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders without crashing', () => {
    shallow(
      <DataSourceMenuPopoverButton className="random" label="button-name" onClick={jest.fn()} />
    );
  });

  it('renders the label correctly', () => {
    const label = 'Test Label';
    const component = mount(
      <DataSourceMenuPopoverButton className="random" label={label} onClick={jest.fn()} />
    );
    expect(component.find('EuiButtonEmpty').text()).toBe(label);
  });

  it('calls onClick when button is clicked', () => {
    const component = mount(<DataSourceMenuPopoverButton className="random" onClick={jest.fn()} />);
    component.find('.dataSourceComponentButtonTitle').first().simulate('click');
    expect(component.find('EuiButtonEmpty').text()).toBe('');
  });
});
