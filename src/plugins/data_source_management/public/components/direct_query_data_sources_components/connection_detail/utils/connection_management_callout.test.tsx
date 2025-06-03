/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { ConnectionManagementCallout } from './connection_management_callout';
import { EuiCallOut } from '@elastic/eui';

describe('ConnectionManagementCallout', () => {
  const shallowComponent = () => shallow(<ConnectionManagementCallout />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the correct title', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiCallOut).prop('title')).toEqual(
      'Configurations may be managed elsewhere.'
    );
  });

  test('displays the correct body text', () => {
    const wrapper = shallowComponent();
    const bodyText = wrapper.find(EuiCallOut).children().text();
    expect(bodyText).toEqual(
      'Access to data may be managed in other systems outside of OpenSearch. Check with your administrator for additional configurations.'
    );
  });

  test('displays the correct icon type', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiCallOut).prop('iconType')).toEqual('iInCircle');
  });
});
