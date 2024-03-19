/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { DataSourceFilterGroup } from './data_source_filter_group';
import { render } from '@testing-library/react';

describe('DataSourceFilterGroup', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  it('should render normally', () => {
    const mockCallBack = jest.fn();
    component = shallow(
      <DataSourceFilterGroup
        selectedOptions={[{ id: '1', label: 'name1', checked: 'on', visible: true }]}
        setSelectedOptions={(items) => mockCallBack(items)}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render popup when clicking on button', async () => {
    const mockCallBack = jest.fn();
    const container = render(
      <DataSourceFilterGroup
        selectedOptions={[{ id: '1', label: 'name1', checked: 'on', visible: true }]}
        setSelectedOptions={(items) => mockCallBack(items)}
      />
    );
    const button = await container.findByTestId('dataSourceFilterGroupButton');
    button.click();
    expect(container).toMatchSnapshot();
  });
});
