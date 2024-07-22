/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { AssociatedObjectsTabFailure } from './associated_objects_tab_failure';
import { EuiEmptyPrompt } from '@elastic/eui';

describe('AssociatedObjectsTabFailure', () => {
  const defaultProps = {
    type: 'databases',
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<AssociatedObjectsTabFailure {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct title', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiEmptyPrompt).prop('title')).toEqual(<h3>Error</h3>);
  });

  test('displays the correct error message based on type', () => {
    const wrapper = shallowComponent();
    const bodyText = wrapper.find(EuiEmptyPrompt).prop('body') as React.ReactElement;
    const wrapperBody = shallow(bodyText);
    expect(wrapperBody.text()).toEqual('Error loading databases');
  });

  test('displays the correct error message for different types', () => {
    const wrapper = shallowComponent({ type: 'tables' });
    const bodyText = wrapper.find(EuiEmptyPrompt).prop('body') as React.ReactElement;
    const wrapperBody = shallow(bodyText);
    expect(wrapperBody.text()).toEqual('Error loading tables');
  });
});
