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
    expect(component.find('EuiButton').text()).toBe(label);
  });

  // ToDo: Find out if this is actually the correct behavior
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/7674
  it('renders a blank label', () => {
    const component = mount(<DataSourceMenuPopoverButton className="random" onClick={jest.fn()} />);
    expect(component.find('EuiButton').text()).toBe('');
  });

  it('calls onClick when button is clicked', () => {
    const onClick = jest.fn();
    const component = mount(<DataSourceMenuPopoverButton className="random" onClick={onClick} />);
    component.find('.dataSourceMenuPopoverButtonLabel').first().simulate('click');
    expect(onClick).toBeCalledTimes(1);
  });
});
