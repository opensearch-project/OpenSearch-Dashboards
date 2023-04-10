/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PageHeader } from './page_header';
import { shallow } from 'enzyme';

describe('PageHeader', () => {
  it('should render normally', () => {
    const component = shallow(<PageHeader />);

    expect(component).toMatchSnapshot();
  });
});
