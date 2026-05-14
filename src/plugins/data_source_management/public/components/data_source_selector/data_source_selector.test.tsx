/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import { DataSourceSelector, LocalCluster } from './data_source_selector';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import {
  getDataSourcesWithFieldsResponse,
  mockManagementPlugin,
  mockResponseForSavedObjectsCalls,
} from '../../mocks';
import { AuthType } from 'src/plugins/data_source/common/data_sources';
import { EuiComboBox } from '@elastic/eui';
import { DataSourceSelectionService } from '../../service/data_source_selection_service';
import * as utils from '../utils';

describe('DataSourceSelector', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();

  const dataSourceSelection = new DataSourceSelectionService();

  beforeEach(() => {
    jest.clearAllMocks();
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    jest.spyOn(utils, 'getWorkspaces').mockReturnValue({
      currentWorkspaceId$: {
        getValue: jest.fn().mockReturnValue('workspace-id'),
      },
    });
  });

  it('should render normally with local cluster not hidden', () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
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

  it('should render normally with local cluster is hidden', () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
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
});

describe('DataSourceSelector: check dataSource options', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();

  const nextTick = () => new Promise((res) => process.nextTick(res));
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const uiSettings = mockedContext.uiSettings;
  const dataSourceSelection = new DataSourceSelectionService();

  beforeEach(async () => {
    jest.clearAllMocks();
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    jest.spyOn(utils, 'getWorkspaces').mockReturnValue({
      currentWorkspaceId$: {
        getValue: jest.fn().mockReturnValue('workspace-id'),
      },
    });
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
  });

  it('should always place local cluster option as the first option when local cluster not hidden', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
      />
    );

    component.instance().componentDidMount!();
    await nextTick();
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should hide prepend if removePrepend is true', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        removePrepend={true}
      />
    );

    component.instance().componentDidMount!();
    await nextTick();
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should show custom placeholder text if configured', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        placeholderText={'Make a selection'}
      />
    );

    component.instance().componentDidMount!();
    await nextTick();
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should filter options if configured', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
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

  it('should return empty options if filter out all options and hide local cluster', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        dataSourceFilter={(ds) => ds.attributes.auth.type === 'random'}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toHaveBeenCalled();
  });

  it('should get default datasource if uiSettings exists', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue('test1');
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
      />
    );

    component.instance().componentDidMount!();
    await nextTick();
    expect(component).toMatchSnapshot();
    expect(uiSettings.getUserProvidedWithScope).toBeCalledWith('defaultDataSource', 'workspace');
  });

  it('should not render options with default badge when id does not matches defaultDataSource', () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
      />
    );
    expect(component).toMatchSnapshot();
    expect(component.find('EuiComboBox').exists()).toBe(true);
  });
});

describe('DataSourceSelector: check defaultOption behavior', () => {
  /**
   * Test Cases
   * - []: 2 cases
   * - Some value: 4 * 3 = 12 cases
   */
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const nextTick = () => new Promise((res) => process.nextTick(res));
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const uiSettings = mockedContext.uiSettings;
  const dataSourceSelection = new DataSourceSelectionService();
  const getMockedDataSourceOptions = () => {
    return getDataSourcesWithFieldsResponse.savedObjects.map((response) => {
      return { id: response.id, label: response.attributes.title };
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
    jest.spyOn(utils, 'getWorkspaces').mockReturnValue({
      currentWorkspaceId$: {
        getValue: jest.fn().mockReturnValue('workspace-id'),
      },
    });
  });

  // When defaultOption is undefined
  it('should render defaultDataSource as the selected option', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue('test1');

    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(
      expect.arrayContaining([
        {
          id: 'test1',
          label: 'test1',
        },
      ])
    );
  });

  it('should render Local Cluster as the selected option when hideLocalCluster is false', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue(null);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(expect.arrayContaining([LocalCluster]));
  });

  it('should render random datasource as the selected option if defaultDataSource and Local Cluster are not present', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue(null);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceFilter={(dataSource) => {
          return dataSource.id !== 'test1';
        }}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(
      expect.arrayContaining([
        {
          id: 'test2',
          label: 'test2',
        },
      ])
    );
  });

  it('should return toast', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue(null);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceFilter={(_) => {
          return false;
        }}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(expect.arrayContaining([]));
    expect(toasts.addWarning).toBeCalled();
  });

  // When defaultOption is []
  it('should render placeholder and all options when Local Cluster is not hidden', async () => {
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue('test1');
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={false}
        fullWidth={false}
        uiSettings={uiSettings}
        defaultOption={[]}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(expect.arrayContaining([]));
    expect(euiComboBox.prop('options')).toEqual(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      expect.arrayContaining(getMockedDataSourceOptions().concat([LocalCluster]))
    );
  });

  it('should render placeholder and all options when Local Cluster is hidden', async () => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue('test1');
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        uiSettings={uiSettings}
        defaultOption={[]}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(expect.arrayContaining([]));
    expect(euiComboBox.prop('options')).toEqual(
      expect.arrayContaining(getMockedDataSourceOptions())
    );
  });

  // When defaultOption is [{id}]
  it.each([
    {
      id: undefined,
    },
    {
      id: '',
    },
    {
      id: 'test2',
    },
    {
      id: 'non-existent-id',
    },
  ])('should all throw a toast warning when the available dataSources is empty', async ({ id }) => {
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue('test1');
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceFilter={(_) => {
          return false;
        }}
        // @ts-expect-error
        defaultOption={[{ id }]}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(expect.arrayContaining([]));
    expect(toasts.addWarning).toBeCalled();
  });

  it.each([
    {
      id: undefined,
    },
    {
      id: '',
    },
    {
      id: 'test2',
    },
    {
      id: 'non-existent-id',
    },
  ])('should all throw a toast warning when the id is filtered out', async ({ id }) => {
    jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue('test1');
    jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
    component = shallow(
      <DataSourceSelector
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSource={jest.fn()}
        disabled={false}
        hideLocalCluster={true}
        fullWidth={false}
        uiSettings={uiSettings}
        dataSourceFilter={(dataSource) => {
          return dataSource.attributes.title !== id;
        }}
        dataSourceSelection={dataSourceSelection}
        // @ts-expect-error
        defaultOption={[{ id }]}
      />
    );
    component.instance().componentDidMount!();
    await nextTick();
    const euiComboBox = component.find(EuiComboBox);
    expect(euiComboBox.prop('selectedOptions')).toEqual(expect.arrayContaining([]));
    expect(toasts.addWarning).toBeCalled();
  });

  it.each([
    {
      id: undefined,
      error: true,
      selectedOption: [],
    },
    {
      id: '',
      error: false,
      selectedOption: [LocalCluster],
    },
    {
      id: 'test2',
      error: false,
      selectedOption: [{ id: 'test2', label: 'test2' }],
    },
    {
      id: 'non-existent-id',
      error: true,
      selectedOption: [],
    },
  ])(
    'should handle selectedOption correctly when defaultOption = [{id}]',
    async ({ id, error, selectedOption }) => {
      jest.spyOn(uiSettings, 'getUserProvidedWithScope').mockReturnValue('test1');
      jest.spyOn(utils, 'getDataSourceSelection').mockReturnValue(dataSourceSelection);
      component = shallow(
        <DataSourceSelector
          savedObjectsClient={client}
          notifications={toasts}
          onSelectedDataSource={jest.fn()}
          disabled={false}
          hideLocalCluster={false}
          fullWidth={false}
          uiSettings={uiSettings}
          dataSourceSelection={dataSourceSelection}
          // @ts-expect-error
          defaultOption={[{ id }]}
        />
      );
      component.instance().componentDidMount!();
      await nextTick();
      const euiComboBox = component.find(EuiComboBox);
      expect(euiComboBox.prop('selectedOptions')).toEqual(expect.arrayContaining(selectedOption));
      if (error) {
        expect(toasts.addWarning).toBeCalled();
      } else {
        expect(toasts.addWarning).toBeCalledTimes(0);
      }
    }
  );
});
