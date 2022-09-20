/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { LoadingMask } from './loading_mask';

describe('Datasource Management: Header', () => {
  test('should render normally', () => {
    const component = shallow(<LoadingMask />);
    expect(component).toMatchSnapshot();
  });
});
