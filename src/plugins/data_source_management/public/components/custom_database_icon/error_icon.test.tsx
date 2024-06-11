/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shallow } from 'enzyme';
import React from 'react';
import { ErrorIcon } from './error_icon';

describe('Test on empty icon', () => {
  it('should render the component normally', () => {
    const component = shallow(<ErrorIcon />);
    expect(component).toMatchSnapshot();
  });
});
