/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { NoDataSource } from './no_data_source';

describe('NoDataSource', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  it('should render normally', () => {
    component = shallow(<NoDataSource />);
    expect(component).toMatchSnapshot();
  });
});
