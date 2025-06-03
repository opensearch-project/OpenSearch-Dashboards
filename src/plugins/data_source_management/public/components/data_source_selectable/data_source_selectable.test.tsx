/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow, mount } from 'enzyme';
import { i18n } from '@osd/i18n';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { DataSourceSelectable } from './data_source_selectable';
import { AuthType } from '../../types';
import { getDataSourcesWithFieldsResponse, mockResponseForSavedObjectsCalls } from '../../mocks';
import { render } from '@testing-library/react';
import * as utils from '../utils';
import {
  NO_DATASOURCES_CONNECTED_MESSAGE,
  CONNECT_DATASOURCES_MESSAGE,
  NO_COMPATIBLE_DATASOURCES_MESSAGE,
  ADD_COMPATIBLE_DATASOURCES_MESSAGE,
} from '../constants';
import { DataSourceSelectionService } from '../../service/data_source_selection_service';

const mockGeneratedComponentId = 'component-id';
jest.mock('uuid', () => ({ v4: () => mockGeneratedComponentId }));

describe('DataSourceSelectable', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  let client: SavedObjectsClientContract;

  const { toasts } = notificationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));
  const noDataSourcesConnectedMessage =
    'No data sources connected yet. Connect your data sources to get started.';
  const noCompatibleDataSourcesMessage =
    'No compatible data sources are available. Add a compatible data source.';
  const dataSourceSelection = new DataSourceSelectionService();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
    spyOn(utils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);
  });

  it('should render normally when local cluster is not hidden', () => {
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
      fields: ['id', 'title', 'auth.type', 'dataSourceVersion', 'installedPlugins'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally when local cluster is hidden', () => {
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
      fields: ['id', 'title', 'auth.type', 'dataSourceVersion', 'installedPlugins'],
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

  it('should show popover with button click', async () => {
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

    const button = await container.findByTestId('dataSourceSelectableButton');
    button.click();

    expect(container.getByTestId('dataSourceSelectableContextMenuPopover')).toBeVisible();
    expect(container).toMatchSnapshot();
  });

  it('should invoke the onSelectedDataSource callback when state changes', async () => {
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
      componentId: mockGeneratedComponentId,
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
      incompatibleDataSourcesExist: false,
    });

    containerInstance.onChange([{ id: 'test2', label: 'test2', checked: 'on' }]);
    expect(containerInstance.state).toEqual({
      componentId: mockGeneratedComponentId,
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
      incompatibleDataSourcesExist: false,
    });

    expect(onSelectedDataSource).toBeCalledWith([{ id: 'test2', label: 'test2' }]);
    expect(onSelectedDataSource).toHaveBeenCalled();
    expect(utils.getDefaultDataSource).toHaveBeenCalled();
  });

  it(`should display selectedOption[0]'s label when available`, async () => {
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
    const button = await container.findByTestId('dataSourceSelectableButton');
    expect(button).toHaveTextContent('test2');
  });

  it(`should display selectedOption[0]'s id when label is not available`, async () => {
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
    const button = await container.findByTestId('dataSourceSelectableButton');
    expect(button).toHaveTextContent('test2');
  });

  it(`should display a warning when selectedOption[0]'s id is undefined`, async () => {
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
    const button = await container.findByTestId('dataSourceSelectableButton');
    expect(button).toHaveTextContent('');
    expect(toasts.addWarning).toBeCalledWith('Data source with ID "" is not available');
  });

  it(`should display a warning when selectedOption[0] is an empty object`, async () => {
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
    const button = await container.findByTestId('dataSourceSelectableButton');
    expect(button).toHaveTextContent('');
    expect(toasts.addWarning).toBeCalledWith('Data source with ID "" is not available');
  });
  it(`should display a warning when selectedOption[0] is missing id but has a label`, async () => {
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
    expect(toasts.addWarning).toBeCalledWith('Data source with ID "" is not available');
  });
  it(`should display a warning when selectedOption[0] is missing id but has a blank label`, async () => {
    const onSelectedDataSource = jest.fn();
    render(
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
    expect(toasts.addWarning).toBeCalledWith('Data source with ID "" is not available');
  });

  it(`should display a warning when selectedOption is an empty array`, async () => {
    const onSelectedDataSource = jest.fn();
    render(
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
    expect(toasts.addWarning).toBeCalledWith('Data source with ID "" is not available');
  });

  it(`should render the selected option when selectedOption[0]'s id is found`, async () => {
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
      componentId: mockGeneratedComponentId,
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
      incompatibleDataSourcesExist: false,
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
      componentId: mockGeneratedComponentId,
      dataSourceOptions: [],
      defaultDataSource: null,
      isPopoverOpen: false,
      selectedOption: [],
      showEmptyState: false,
      showError: true,
      incompatibleDataSourcesExist: false,
    });

    containerInstance.onChange([{ id: 'test2', label: 'test2', checked: 'on' }]);
    expect(containerInstance.state).toEqual({
      componentId: mockGeneratedComponentId,
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
      incompatibleDataSourcesExist: false,
    });

    expect(onSelectedDataSource).toBeCalledWith([{ id: 'test2', label: 'test2' }]);
    expect(onSelectedDataSource).toHaveBeenCalled();
  });

  it.each([
    {
      findFunc: jest.fn().mockResolvedValue({ savedObjects: [] }),
      defaultMessage: noDataSourcesConnectedMessage,
      selectedOption: undefined,
    },
    {
      findFunc: jest.fn().mockResolvedValue({ savedObjects: [] }),
      defaultMessage: noDataSourcesConnectedMessage,
      selectedOption: [{ id: 'test2' }],
    },
    {
      findFunc: jest.fn().mockResolvedValue(getDataSourcesWithFieldsResponse),
      defaultMessage: noCompatibleDataSourcesMessage,
      selectedOption: undefined,
    },
    {
      findFunc: jest.fn().mockResolvedValue(getDataSourcesWithFieldsResponse),
      defaultMessage: noCompatibleDataSourcesMessage,
      selectedOption: [{ id: 'test2' }],
    },
  ])(
    'should render correct message when there are no datasource options available and local cluster is hidden',
    async ({ findFunc, selectedOption, defaultMessage }) => {
      client.find = findFunc;
      const onSelectedDataSource = jest.fn();
      render(
        <DataSourceSelectable
          savedObjectsClient={client}
          notifications={toasts}
          onSelectedDataSources={onSelectedDataSource}
          disabled={false}
          hideLocalCluster={true}
          fullWidth={false}
          selectedOption={selectedOption}
          dataSourceFilter={(ds) => false}
        />
      );
      await nextTick();

      expect(toasts.add).toBeCalledWith(
        expect.objectContaining({
          title: defaultMessage,
        })
      );
      expect(onSelectedDataSource).toBeCalledWith([]);
    }
  );

  it('should call dataSourceSelection selectDataSource when selecting', async () => {
    spyOn(utils, 'getDefaultDataSource').and.returnValue([{ id: 'test2', label: 'test2' }]);
    const dataSourceSelectionMock = new DataSourceSelectionService();
    const componentId = 'component-id';
    const selectedOptions = [{ id: 'test2', label: 'test2' }];
    dataSourceSelectionMock.selectDataSource = jest.fn();
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelectionMock);
    jest.spyOn(utils, 'generateComponentId').mockReturnValue(componentId);
    mount(
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
    await nextTick();
    expect(dataSourceSelectionMock.selectDataSource).toHaveBeenCalledWith(
      componentId,
      selectedOptions
    );
  });
});
