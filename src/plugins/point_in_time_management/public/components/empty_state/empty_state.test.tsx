/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EmptyState } from './empty_state';
import { shallow } from 'enzyme';

describe('EmptyState', () => {
  it('should render normally', () => {
    const component = shallow(<EmptyState />);

    expect(component).toMatchSnapshot();
  });
});
