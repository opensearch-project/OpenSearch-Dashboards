/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { DataSourceAggregatedView } from './data_source_aggregated_view';
import { SavedObject, SavedObjectsClientContract } from '../../../../../core/public';
import {
  applicationServiceMock,
  notificationServiceMock,
  uiSettingsServiceMock,
} from '../../../../../core/public/mocks';
import {
  getDataSourcesWithFieldsResponse,
  mockResponseForSavedObjectsCalls,
  mockUiSettingsCalls,
  mockErrorResponseForSavedObjectsCalls,
} from '../../mocks';
import * as utils from '../utils';
import { EuiSelectable, EuiSwitch } from '@elastic/eui';
import { DataSourceAttributes } from '../../types';

describe('DataSourceAggregatedView: read all view (displayAllCompatibleDataSources is set to true)', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const uiSettings = uiSettingsServiceMock.createStartContract();
  const application = applicationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
    mockUiSettingsCalls(uiSettings, 'get', 'test1');
    jest.spyOn(utils, 'getApplication').mockReturnValue(application);
  });

  it.each([
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: false,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      activeDataSourceIds: ['non-existent-id'],
      hideLocalCluster: false,
    },
    {
      filter: undefined,
      activeDataSourceIds: undefined,
      hideLocalCluster: false,
    },
    {
      filter: undefined,
      activeDataSourceIds: ['non-existent-id'],
      hideLocalCluster: false,
    },
    {
      filter: undefined,
      activeDataSourceIds: ['test1'],
      hideLocalCluster: false,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      activeDataSourceIds: ['non-existent-id'],
      hideLocalCluster: true,
    },
    {
      filter: undefined,
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
    },
    {
      filter: undefined,
      activeDataSourceIds: ['non-existent-id'],
      hideLocalCluster: true,
    },
    {
      filter: undefined,
      activeDataSourceIds: ['test1'],
      hideLocalCluster: true,
    },
  ])(
    'should render normally with local cluster configured, default datasource removed or added, and if activeDataSourceIds is present or filtered out',
    async ({ filter, activeDataSourceIds, hideLocalCluster }) => {
      component = shallow(
        <DataSourceAggregatedView
          fullWidth={false}
          hideLocalCluster={hideLocalCluster}
          savedObjectsClient={client}
          notifications={toasts}
          displayAllCompatibleDataSources={true}
          uiSettings={uiSettings}
          activeDataSourceIds={activeDataSourceIds}
          dataSourceFilter={filter}
        />
      );

      // Renders normally
      expect(component).toMatchSnapshot();
      expect(client.find).toBeCalledWith({
        fields: ['id', 'title', 'auth.type'],
        perPage: 10000,
        type: 'data-source',
      });
      expect(toasts.addWarning).toBeCalledTimes(0);
      await nextTick();

      // Renders correctly for hide local cluster configuration
      if (!hideLocalCluster) {
        expect(component.find(EuiSelectable).prop('options')).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: '' })])
        );
      } else {
        expect(component.find(EuiSelectable).prop('options')).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: '' })])
        );
      }

      // Renders correctly when default datasource is filtered out or not
      if (!filter) {
        expect(component.find(EuiSelectable).prop('options')).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: 'test1' })])
        );
      } else {
        expect(component.find(EuiSelectable).prop('options')).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: 'test1' })])
        );
      }

      // All renders should not have a switch
      expect(component.find(EuiSwitch).exists()).toBeFalsy();
    }
  );
});

describe('DataSourceAggregatedView: read active view (displayAllCompatibleDataSources is set to false)', () => {
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const uiSettings = uiSettingsServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
    mockUiSettingsCalls(uiSettings, 'get', 'test1');
  });

  it.each([
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      hideLocalCluster: false,
      activeDataSourceIds: ['test1', 'test2'],
    },
    {
      filter: undefined,
      hideLocalCluster: false,
      activeDataSourceIds: ['test1', 'test2'],
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      hideLocalCluster: true,
      activeDataSourceIds: ['test1', 'test2'],
    },
    {
      filter: undefined,
      hideLocalCluster: true,
      activeDataSourceIds: ['test1', 'test2'],
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      hideLocalCluster: false,
      activeDataSourceIds: [],
    },
    {
      filter: undefined,
      hideLocalCluster: false,
      activeDataSourceIds: [],
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return ds.id !== 'test1';
      },
      hideLocalCluster: true,
      activeDataSourceIds: [],
    },
    {
      filter: undefined,
      hideLocalCluster: true,
      activeDataSourceIds: [],
    },
  ])(
    'should render normally with local cluster and active selections configured',
    async ({ filter, hideLocalCluster, activeDataSourceIds }) => {
      const component = shallow(
        <DataSourceAggregatedView
          fullWidth={false}
          hideLocalCluster={hideLocalCluster}
          savedObjectsClient={client}
          notifications={toasts}
          displayAllCompatibleDataSources={false}
          activeDataSourceIds={activeDataSourceIds}
          dataSourceFilter={filter}
          uiSettings={uiSettings}
        />
      );
      await nextTick();

      // Should render normally
      expect(component).toMatchSnapshot();
      expect(client.find).toBeCalledWith({
        fields: ['id', 'title', 'auth.type'],
        perPage: 10000,
        type: 'data-source',
      });
      expect(toasts.addWarning).toBeCalledTimes(0);

      // Should render only active options
      const euiSwitch = component.find(EuiSwitch);
      expect(euiSwitch.exists()).toBeTruthy();
      euiSwitch.prop('onChange')({ target: { checked: true } });
      const expectedOptions = activeDataSourceIds.length
        ? [
            {
              id: 'test2',
              label: 'test2',
              disabled: true,
              checked: 'on',
            },
          ]
        : [];

      if (!filter && activeDataSourceIds.length) {
        expectedOptions.push({
          id: 'test1',
          label: 'test1',
          disabled: true,
          checked: 'on',
        });
      }
      expect(component.find(EuiSelectable).prop('options')).toEqual(
        expect.arrayContaining(expectedOptions)
      );
    }
  );
});

describe('DataSourceAggregatedView empty state test with local cluster hiding', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const uiSettings = uiSettingsServiceMock.createStartContract();
  const application = applicationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', {});
    mockUiSettingsCalls(uiSettings, 'get', 'test1');
    jest.spyOn(utils, 'getApplication').mockReturnValue(application);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks to reset call counts and mock implementations
  });

  it.each([
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return true;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: true,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return false;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: true,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return true;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: false,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return false;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: false,
    },
  ])(
    'should render warning when no data sources added',
    async ({ filter, activeDataSourceIds, hideLocalCluster, displayAllCompatibleDataSources }) => {
      component = shallow(
        <DataSourceAggregatedView
          fullWidth={false}
          hideLocalCluster={hideLocalCluster}
          savedObjectsClient={client}
          notifications={toasts}
          displayAllCompatibleDataSources={displayAllCompatibleDataSources}
          uiSettings={uiSettings}
          activeDataSourceIds={activeDataSourceIds}
          dataSourceFilter={filter}
        />
      );

      expect(component).toMatchSnapshot();
      await nextTick();
      expect(toasts.add).toHaveBeenCalledTimes(1);
      expect(toasts.add.mock.calls[0][0]).toEqual({
        color: 'warning',
        text: expect.any(Function),
        title: 'No data sources connected yet. Connect your data sources to get started.',
      });
      expect(component.state('showEmptyState')).toBe(true);
      await nextTick();
      expect(component.find('NoDataSource').exists()).toBe(true);
    }
  );
});

describe('DataSourceAggregatedView empty state test due to filter out with local cluster hiding', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const uiSettings = uiSettingsServiceMock.createStartContract();
  const application = applicationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
    mockUiSettingsCalls(uiSettings, 'get', 'test1');
    jest.spyOn(utils, 'getApplication').mockReturnValue(application);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks to reset call counts and mock implementations
  });

  it.each([
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return false;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: true,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return false;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: false,
    },
  ])(
    'should render warning when no data sources added',
    async ({ filter, activeDataSourceIds, hideLocalCluster, displayAllCompatibleDataSources }) => {
      component = shallow(
        <DataSourceAggregatedView
          fullWidth={false}
          hideLocalCluster={hideLocalCluster}
          savedObjectsClient={client}
          notifications={toasts}
          displayAllCompatibleDataSources={displayAllCompatibleDataSources}
          uiSettings={uiSettings}
          activeDataSourceIds={activeDataSourceIds}
          dataSourceFilter={filter}
        />
      );

      expect(component).toMatchSnapshot();
      await nextTick();
      expect(toasts.add).toHaveBeenCalledTimes(1);
      expect(toasts.add.mock.calls[0][0]).toEqual({
        color: 'warning',
        text: expect.any(Function),
        title: 'No data sources connected yet. Connect your data sources to get started.',
      });
      expect(component.state('showEmptyState')).toBe(true);
      await nextTick();
      expect(component.find('NoDataSource').exists()).toBe(true);
    }
  );
});

describe('DataSourceAggregatedView error state test no matter hide local cluster or not', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const uiSettings = uiSettingsServiceMock.createStartContract();
  const application = applicationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockErrorResponseForSavedObjectsCalls(client, 'find');
    mockUiSettingsCalls(uiSettings, 'get', 'test1');
    jest.spyOn(utils, 'getApplication').mockReturnValue(application);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks to reset call counts and mock implementations
  });

  it.each([
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return true;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: true,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return false;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: true,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return true;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: false,
    },
    {
      filter: (ds: SavedObject<DataSourceAttributes>) => {
        return false;
      },
      activeDataSourceIds: undefined,
      hideLocalCluster: true,
      displayAllCompatibleDataSources: false,
    },
  ])(
    'should render error state when catch error',
    async ({ filter, activeDataSourceIds, hideLocalCluster, displayAllCompatibleDataSources }) => {
      component = shallow(
        <DataSourceAggregatedView
          fullWidth={false}
          hideLocalCluster={hideLocalCluster}
          savedObjectsClient={client}
          notifications={toasts}
          displayAllCompatibleDataSources={displayAllCompatibleDataSources}
          uiSettings={uiSettings}
          activeDataSourceIds={activeDataSourceIds}
          dataSourceFilter={filter}
        />
      );

      expect(component).toMatchSnapshot();
      await nextTick();
      expect(toasts.add).toBeCalled();
      expect(component.state('showError')).toBe(true);
    }
  );
});
