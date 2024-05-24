/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shallow } from 'enzyme';
import React from 'react';
import { EmptyIcon } from './empty_icon';

describe('Test on empty icon', () => {
  it('should render the component normally', () => {
    const component = shallow(<EmptyIcon />);
    expect(component).toMatchSnapshot();
  });
});
