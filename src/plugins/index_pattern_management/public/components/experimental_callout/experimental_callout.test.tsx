/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { ExperimentalCallout } from './experimental_callout';

describe('Index pattern experimental callout component', () => {
  test('should render normally', () => {
    const component = shallow(<ExperimentalCallout />);
    expect(component).toMatchSnapshot();
  });
});
