/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { Header } from '../header';

describe('Header', () => {
  test('should render normally', () => {
    const component = shallow(<Header />);

    expect(component).toMatchSnapshot();
  });
});
