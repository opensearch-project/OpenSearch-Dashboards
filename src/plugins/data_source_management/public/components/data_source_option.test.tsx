/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shallow } from 'enzyme';
import React from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { DataSourceOptionItem } from './data_source_option';
import { SelectedDataSourceOption } from './data_source_multi_selectable/data_source_filter_group';

describe('Test on ShowDataSourceOption', () => {
  it('should render the component with label', () => {
    const item: SelectedDataSourceOption = {
      id: '1',
      label: 'DataSource 1',
      visible: true,
    };
    const defaultDataSource = null;

    const component = shallow(
      <DataSourceOptionItem item={item} defaultDataSource={defaultDataSource} />
    );

    expect(component.find(EuiFlexGroup)).toHaveLength(1);
    expect(component.find(EuiFlexItem)).toHaveLength(1);
    expect(component.find(EuiBadge)).toHaveLength(0);
  });

  it('should render the component with label and default badge', () => {
    const item = {
      id: '1',
      label: 'DataSource 1',
      visible: true,
    };
    const defaultDataSource = '1';

    const component = shallow(
      <DataSourceOptionItem item={item} defaultDataSource={defaultDataSource} />
    );

    expect(component.find(EuiFlexGroup)).toHaveLength(1);
    expect(component.find(EuiFlexItem)).toHaveLength(2);
    expect(component.find(EuiBadge)).toHaveLength(1);
  });
});
