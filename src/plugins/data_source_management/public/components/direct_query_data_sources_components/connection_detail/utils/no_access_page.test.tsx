/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { NoAccess } from './no_access_page';
import { EuiEmptyPrompt, EuiButton, EuiText } from '@elastic/eui';

describe('NoAccess', () => {
  const shallowComponent = () => shallow(<NoAccess />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct icon type', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiEmptyPrompt).prop('iconType')).toEqual('alert');
  });

  test('displays the correct title', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiEmptyPrompt).prop('title')).toEqual(
      <h2>{'No permissions to access'}</h2>
    );
  });

  test('displays the correct body text', () => {
    const wrapper = shallowComponent();
    const bodyText = wrapper.find(EuiEmptyPrompt).prop('body') as React.ReactElement;
    const wrapperBody = shallow(<div>{bodyText}</div>);
    expect(wrapperBody.find(EuiText).dive().text()).toEqual(
      'You are missing permissions to view connection details. Contact your administrator for permissions.'
    );
  });

  test('renders a button with correct text and click behavior', () => {
    const wrapper = shallowComponent();
    const actions = wrapper.find(EuiEmptyPrompt).prop('actions') as React.ReactElement;
    const wrapperActions = shallow(<div>{actions}</div>);
    const button = wrapperActions.find(EuiButton);
    expect(button.prop('color')).toEqual('primary');
    expect(button.prop('fill')).toBe(true);
    expect(button.children().text()).toEqual('Return to data connections');

    // Simulate click
    const originalHash = window.location.hash;
    window.location.hash = '#test';
    button.simulate('click');
    expect(window.location.hash).toBe('');
    window.location.hash = originalHash; // Restore original hash
  });
});
