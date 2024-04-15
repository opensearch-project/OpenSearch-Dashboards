/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { DataSourceFilterGroup } from './data_source_filter_group';
import { render, fireEvent, screen } from '@testing-library/react';

describe('DataSourceFilterGroup', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  it('should render normally', () => {
    const mockCallBack = jest.fn();
    component = shallow(
      <DataSourceFilterGroup
        selectedOptions={[{ id: '1', label: 'name1', checked: 'on', visible: true }]}
        setSelectedOptions={(items) => mockCallBack(items)}
        defaultDataSource="1"
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
        defaultDataSource="1"
      />
    );
    const button = await container.findByTestId('dataSourceFilterGroupButton');
    button.click();
    expect(container).toMatchSnapshot();
    expect(mockCallBack).toBeCalledTimes(0);

    fireEvent.click(screen.getByText('name1'));
    expect(mockCallBack).toBeCalledWith([
      { checked: undefined, id: '1', label: 'name1', visible: true },
    ]);
  });

  it('should toggle all when clicking on button and should search', async () => {
    const mockCallBack = jest.fn();
    const container = render(
      <DataSourceFilterGroup
        selectedOptions={[{ id: '1', label: 'name1', checked: 'on', visible: true }]}
        setSelectedOptions={(items) => mockCallBack(items)}
      />
    );
    const button = await container.findByTestId('dataSourceFilterGroupButton');
    button.click();

    fireEvent.click(screen.getByText('Deselect all'));
    expect(mockCallBack).toBeCalledWith([
      { checked: undefined, id: '1', label: 'name1', visible: true },
    ]);

    fireEvent.click(screen.getByText('Select all'));
    expect(mockCallBack).toBeCalledWith([
      { checked: 'on', id: '1', label: 'name1', visible: true },
    ]);

    const input = screen.getByTestId('dataSourceMultiSelectFieldSearch');
    fireEvent.change(input, { target: { value: 'random input' } });
    fireEvent.keyDown(input, { key: 'enter', keyCode: 13 });

    expect(mockCallBack).toBeCalledWith([
      { checked: 'on', id: '1', label: 'name1', visible: false },
    ]);

    expect(container).toMatchSnapshot();
  });
});
