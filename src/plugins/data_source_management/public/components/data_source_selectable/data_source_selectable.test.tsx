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
import { EuiSelectable } from '@elastic/eui';
import { dataSourceOptionGroupLabel } from '../utils';

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
      showEmptyState: false,
      selectedOption: [
        {
          id: 'test2',
          label: 'test2',
        },
      ],
      showError: false,
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
      showEmptyState: false,
      selectedOption: [
        {
          checked: 'on',
          id: 'test2',
          label: 'test2',
        },
      ],
      showError: false,
    });

    expect(onSelectedDataSource).toBeCalledWith([{ id: 'test2', label: 'test2' }]);
    expect(onSelectedDataSource).toHaveBeenCalled();
    expect(utils.getDefaultDataSource).toHaveBeenCalled();
  });

  it('should display selected option label normally', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        selectedOption={[{ id: 'test2', label: 'test2' }]}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );

    await nextTick();
    const button = await container.findByTestId('dataSourceSelectableContextMenuHeaderLink');
    expect(button).toHaveTextContent('test2');
  });

  it('should render normally even only provide dataSourceId', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        selectedOption={[{ id: 'test2' }]}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );
    await nextTick();
    const button = await container.findByTestId('dataSourceSelectableContextMenuHeaderLink');
    expect(button).toHaveTextContent('test2');
  });

  it('should render warning if provide undefined dataSourceId', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        selectedOption={[{ id: undefined }]}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );
    await nextTick();
    const button = await container.findByTestId('dataSourceSelectableContextMenuHeaderLink');
    expect(button).toHaveTextContent('');
    expect(toasts.addWarning).toBeCalledWith('Data source with id: undefined is not available');
  });

  it('should render warning if provide empty object', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        selectedOption={[{}]}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );
    await nextTick();
    const button = await container.findByTestId('dataSourceSelectableContextMenuHeaderLink');
    expect(button).toHaveTextContent('');
    expect(toasts.addWarning).toBeCalledWith('Data source with id: undefined is not available');
  });
  it('should warning if only provide label', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        selectedOption={[{ label: 'test-label' }]}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );
    await nextTick();
    expect(toasts.addWarning).toBeCalledWith('Data source with id: undefined is not available');
  });
  it('should warning if only provide empty label', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        selectedOption={[{ label: '' }]}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== AuthType.NoAuth}
      />
    );
    await nextTick();
    expect(toasts.addWarning).toBeCalledWith('Data source with id: undefined is not available');
  });

  it('should warning if only provide empty array', async () => {
    const onSelectedDataSource = jest.fn();
    const container = render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        selectedOption={[]}
      />
    );
    await nextTick();
    expect(toasts.addWarning).toBeCalledWith('Data source with id: undefined is not available');
  });

  it('should render the selected option when pass in the valid dataSourceId', async () => {
    const onSelectedDataSource = jest.fn();
    const container = mount(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        selectedOption={[{ id: 'test2' }]}
      />
    );
    await nextTick();
    const containerInstance = container.instance();
    expect(containerInstance.state).toEqual({
      dataSourceOptions: [
        {
          id: 'test1',
          label: 'test1',
        },
        {
          checked: 'on',
          id: 'test2',
          label: 'test2',
        },
        {
          id: 'test3',
          label: 'test3',
        },
      ],
      defaultDataSource: null,
      isPopoverOpen: false,
      showEmptyState: false,
      selectedOption: [
        {
          id: 'test2',
          label: 'test2',
        },
      ],
      showError: false,
    });
  });

  it('should render nothing when no default option or activeOption', async () => {
    const onSelectedDataSource = jest.fn();
    spyOn(utils, 'getDefaultDataSource').and.returnValue(undefined);
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

    expect(onSelectedDataSource).toBeCalledWith([]);
    expect(containerInstance.state).toEqual({
      dataSourceOptions: [],
      defaultDataSource: null,
      isPopoverOpen: false,
      selectedOption: [],
      showEmptyState: false,
      showError: true,
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
      showEmptyState: false,
      selectedOption: [
        {
          checked: 'on',
          id: 'test2',
          label: 'test2',
        },
      ],
      showError: true,
    });

    expect(onSelectedDataSource).toBeCalledWith([{ id: 'test2', label: 'test2' }]);
    expect(onSelectedDataSource).toHaveBeenCalled();
  });
  it('should render no data source when no data source filtered out and hide local cluster', async () => {
    const onSelectedDataSource = jest.fn();
    render(
      <DataSourceSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        selectedOption={[{ id: 'test2' }]}
        dataSourceFilter={(ds) => false}
      />
    );
    await nextTick();
    expect(toasts.add).toBeCalled();
    expect(onSelectedDataSource).toBeCalledWith([]);
  });
});
