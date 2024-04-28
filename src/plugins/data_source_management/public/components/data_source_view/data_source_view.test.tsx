/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { DataSourceView } from './data_source_view';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import {
  applicationServiceMock,
  notificationServiceMock,
  uiSettingsServiceMock,
} from '../../../../../core/public/mocks';
import {
  getSingleDataSourceResponse,
  mockManagementPlugin,
  mockResponseForSavedObjectsCalls,
  mockUiSettingsCalls,
} from '../../mocks';
import { render } from '@testing-library/react';
import * as utils from '../utils';
import { DataSourceSelectionService } from '../../service/data_source_selection_service';

describe('DataSourceView', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const dataSourceSelection = new DataSourceSelectionService();
  const { toasts } = notificationServiceMock.createStartContract();
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const uiSettings = mockedContext.uiSettings;
  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    jest.clearAllMocks();
    client = {
      get: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'get', getSingleDataSourceResponse);
    spyOn(utils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);
  });

  it('should render normally with local cluster not hidden', () => {
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1', label: 'test1' }]}
        hideLocalCluster={false}
        onSelectedDataSources={jest.fn()}
      />
    );
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
  it('When selected option is local cluster and hide local Cluster is true, should return error', () => {
    const onSelectedDataSources = jest.fn();
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: '' }]}
        hideLocalCluster={true}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSources}
      />
    );
    expect(component).toMatchSnapshot();
    expect(onSelectedDataSources).toBeCalledWith([]);
  });
  it('Should return error when provided datasource has been filtered out', async () => {
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1', label: 'test1' }]}
        hideLocalCluster={false}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        dataSourceFilter={(ds) => {
          return false;
        }}
      />
    );
    expect(component).toMatchSnapshot();
  });
  it('Should render successfully when provided datasource has not been filtered out', async () => {
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        hideLocalCluster={false}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        dataSourceFilter={(ds) => {
          return true;
        }}
      />
    );
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
    expect(utils.getDataSourceById).toBeCalledTimes(1);
  });
  it('should call getDataSourceById when only pass id with no label', async () => {
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        savedObjectsClient={client}
        notifications={toasts}
        hideLocalCluster={false}
        onSelectedDataSources={jest.fn()}
      />
    );
    expect(component).toMatchSnapshot();
    expect(utils.getDataSourceById).toBeCalledTimes(1);
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
  it('should call notification warning when there is data source fetch error', async () => {
    spyOn(utils, 'getDataSourceById').and.throwError('Data source is not available');
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        savedObjectsClient={client}
        notifications={toasts}
        hideLocalCluster={false}
        onSelectedDataSources={jest.fn()}
      />
    );
    expect(component).toMatchSnapshot();
    expect(toasts.add).toBeCalledTimes(1);
    expect(utils.getDataSourceById).toBeCalledTimes(1);
  });

  it('should show popover when click on data source view button', async () => {
    const onSelectedDataSource = jest.fn();
    spyOn(utils, 'getDataSourceById').and.returnValue([{ id: 'test1', label: 'test1' }]);
    spyOn(utils, 'handleDataSourceFetchError').and.returnValue('');
    const container = render(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        selectedOption={[{ id: 'test1' }]}
        onSelectedDataSources={onSelectedDataSource}
        hideLocalCluster={false}
        fullWidth={false}
      />
    );
    const button = await container.findByTestId('dataSourceViewButton');
    button.click();
    expect(container).toMatchSnapshot();
  });

  it('should render no data source when no data source filtered out and hide local cluster', async () => {
    const onSelectedDataSource = jest.fn();
    render(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={onSelectedDataSource}
        hideLocalCluster={true}
        fullWidth={false}
        selectedOption={[{ id: '' }]}
        dataSourceFilter={(ds) => false}
      />
    );
    expect(onSelectedDataSource).toBeCalledWith([]);
  });

  it('should render fetch error when pass in invalid data source id', async () => {
    spyOn(utils, 'getDataSourceById').and.throwError('Data source is not available');
    const container = render(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        selectedOption={[{ id: 'any id' }]}
        hideLocalCluster={false}
        fullWidth={false}
      />
    );
    const button = await container.findByTestId('dataSourceViewErrorPopover');
    button.click();
    expect(component).toMatchSnapshot();
    expect(toasts.add).toBeCalledTimes(1);
    expect(utils.getDataSourceById).toBeCalledTimes(1);
    expect(container.getByTestId('dataSourceViewErrorHeaderLink')).toBeVisible();
  });

  it('should render expected error message when pass in invalid data source id ', async () => {
    spyOn(utils, 'getDataSourceById').and.throwError('Data source is not available');
    spyOn(uiSettings, 'get').and.returnValue('test2');
    const container = render(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        selectedOption={[{ id: 'any id' }]}
        hideLocalCluster={false}
        fullWidth={false}
      />
    );
    const button = await container.findByTestId('dataSourceViewErrorPopover');
    button.click();
    expect(component).toMatchSnapshot();
    expect(toasts.add).toBeCalledTimes(1);
    expect(utils.getDataSourceById).toBeCalledTimes(1);
    expect(container.getByTestId('dataSourceViewErrorHeaderLink')).toBeVisible();
    const errorHeaderLink = await container.findByTestId('dataSourceViewErrorHeaderLink');
    errorHeaderLink.click();
    await nextTick();
    expect(container.getByTestId('datasourceViewErrorPanel')).toBeVisible();
  });

  it('can handle switch default data source with non-null default data source', async () => {
    spyOn(uiSettings, 'get').and.returnValue('test2');
    spyOn(utils, 'getDataSourceById').and.returnValue({ id: 'test2', label: 'test2' });
    const onSelectedDataSources = jest.fn();
    const container = mount(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        selectedOption={[{ id: 'any id' }]}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
        onSelectedDataSources={onSelectedDataSources}
      />
    );
    const instance = container.instance();
    await nextTick();
    instance.handleSwitchDefaultDatasource({ id: 'test2', label: 'test2' });
    await nextTick();
    const newState = instance.state;
    expect(newState).toEqual({
      isPopoverOpen: false,
      selectedOption: [{ id: 'test2', label: 'test2' }],
      showEmptyState: false,
      showError: false,
      defaultDataSource: null,
    });
  });

  it('can handle switch default data source with non-null default data source and no onSelectedDataSources', async () => {
    spyOn(uiSettings, 'get').and.returnValue('test2');
    spyOn(utils, 'getDataSourceById').and.returnValue({ id: 'test2', label: 'test2' });
    const container = mount(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        selectedOption={[{ id: 'any id' }]}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
      />
    );
    const instance = container.instance();
    await nextTick();
    instance.handleSwitchDefaultDatasource({ id: 'test2', label: 'test2' });
    await nextTick();
    const newState = instance.state;
    expect(newState).toEqual({
      isPopoverOpen: false,
      selectedOption: [{ id: 'test2', label: 'test2' }],
      showEmptyState: false,
      showError: false,
      defaultDataSource: null,
    });
  });

  it('should showError  when pass in invalid data source id ', async () => {
    spyOn(utils, 'getDataSourceById').and.throwError('Data source is not available');
    spyOn(uiSettings, 'get').and.returnValue('test2');

    const container = mount(
      <DataSourceView
        savedObjectsClient={client}
        notifications={toasts}
        selectedOption={[{ id: 'any id' }]}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
      />
    );
    const instance = container.instance();
    await nextTick();
    expect(instance.state).toEqual({
      isPopoverOpen: false,
      selectedOption: [{ id: 'any id' }],
      showEmptyState: false,
      showError: true,
      defaultDataSource: null,
    });
  });

  it('Should render nothing and call toast when provided datasource has been filtered out', async () => {
    spyOn(utils, 'getDataSourceById').and.returnValue({ id: 'test1', label: 'test1' });
    spyOn(uiSettings, 'get').and.returnValue('test1');
    const container = mount(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        hideLocalCluster={true}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        dataSourceFilter={(ds) => {
          return ds.id !== 'test1';
        }}
      />
    );
    const instance = container.instance();
    await nextTick();
    expect(instance.state).toEqual({
      isPopoverOpen: false,
      selectedOption: [{ id: 'test1' }], // keep the same as before but no label
      showEmptyState: false,
      showError: true,
      defaultDataSource: null,
    });
  });

  it('Should render selected option even when provided datasource has been filtered out', async () => {
    const container = render(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1', label: 'test1' }]}
        hideLocalCluster={false}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        dataSourceFilter={(ds) => {
          return ds.id !== 'test1';
        }}
      />
    );
    const button = await container.findByTestId('dataSourceViewButton');
    expect(button).toHaveTextContent('test1');
  });
});
