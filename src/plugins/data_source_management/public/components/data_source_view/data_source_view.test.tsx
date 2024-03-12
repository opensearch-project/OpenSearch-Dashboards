/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { DataSourceView } from './data_source_view';

describe('DataSourceView', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  it('should render normally with local cluster not hidden', () => {
    component = shallow(
      <DataSourceView fullWidth={false} selectedOption={[{ id: 'test1', label: 'test1' }]} />
    );
    expect(component).toMatchSnapshot();
  });
});
