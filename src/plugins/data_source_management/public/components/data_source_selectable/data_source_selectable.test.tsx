/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow, mount } from 'enzyme';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { DataSourceSelectable } from './data_source_selectable';
import { AuthType } from '../../types';
import { getDataSourcesWithFieldsResponse, mockResponseForSavedObjectsCalls } from '../../mocks';
import { render } from '@testing-library/react';
import * as utils from '../utils';

describe('DataSourceSelectable', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
  });

  it('should render normally with local cluster not hidden', () => {
    component = shallow(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
      />
    );
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally with local cluster is hidden', () => {
    component = shallow(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
      />
    );
    expect(component).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should filter options if configured', async () => {
    component = shallow(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should show popover when click on button', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );

    await nextTick();

    const button = await container.findByTestId('dataSourceSelectableContextMenuHeaderLink');
    button.click();

    expect(container.getByTestId('dataSourceSelectableContextMenuPopover')).toBeVisible();
    expect(container).toMatchSnapshot();
  });

  it('should callback if changed state', async () => {
    const onSelectedDataSource = jest.fn();
    spyOn(utils, 'getDefaultDataSource').and.returnValue([{ id: 'test2', label: 'test2' }]);
    const container = mount(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );
    await nextTick();

    const containerInstance = container.instance();

    containerInstance.onChange([{ id: 'test2', label: 'test2' }]);
    expect(onSelectedDataSource).toBeCalledTimes(1);
    expect(containerInstance.state).toEqual({
      dataSourceOptions: [
        {
          id: 'test2',
          label: 'test2',
        },
      ],
      defaultDataSource: null,
      isPopoverOpen: false,
      selectedOption: [
        {
          id: 'test2',
          label: 'test2',
        },
      ],
    });

    containerInstance.onChange([{ id: 'test2', label: 'test2', checked: 'on' }]);
    expect(containerInstance.state).toEqual({
      dataSourceOptions: [
        {
          checked: 'on',
          id: 'test2',
          label: 'test2',
        },
      ],
      defaultDataSource: null,
      isPopoverOpen: false,
      selectedOption: [
        {
          checked: 'on',
          id: 'test2',
          label: 'test2',
        },
      ],
    });

    expect(onSelectedDataSource).toBeCalledWith([{ id: 'test2', label: 'test2' }]);
    expect(onSelectedDataSource).toHaveBeenCalled();
    expect(utils.getDefaultDataSource).toHaveBeenCalled();
  });
});
