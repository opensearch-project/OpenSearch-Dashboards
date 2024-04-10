/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, mount, shallow } from 'enzyme';
import React from 'react';
import { DataSourceAggregatedView } from './data_source_aggregated_view';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import { mockManagementPlugin } from '../../mocks';
import { getDataSourcesWithFieldsResponse, mockResponseForSavedObjectsCalls } from '../../mocks';

describe('DataSourceAggregatedView', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const uiSettings = mockedContext.uiSettings;

  beforeEach(() => {
    jest.clearAllMocks();

    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
  });

  it('should render normally with local cluster not hidden and all options', async () => {
    spyOn(uiSettings, 'get').and.returnValue('test1');
    component = shallow(
      <DataSourceAggregatedView
        fullWidth={false}
        hideLocalCluster={false}
        savedObjectsClient={client}
        notifications={toasts}
        displayAllCompatibleDataSources={true}
        uiSettings={uiSettings}
      />
    );
    await component.instance().componentDidMount!();
    expect(component).toMatchSnapshot();
    expect(uiSettings.get).toBeCalledWith('defaultDataSource', null);
    expect(component.state('defaultDataSource')).toBe('test1');
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(component.state('dataSourceOptions')).toHaveLength(4);
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally with local cluster hidden and all options', () => {
    const container = mount(
      <DataSourceAggregatedView
        fullWidth={false}
        hideLocalCluster={true}
        savedObjectsClient={client}
        notifications={toasts}
        displayAllCompatibleDataSources={false}
        activeDataSourceIds={[]}
      />
    );
    expect(container).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally with local cluster and actice selections', () => {
    const container = mount(
      <DataSourceAggregatedView
        fullWidth={false}
        hideLocalCluster={false}
        savedObjectsClient={client}
        notifications={toasts}
        displayAllCompatibleDataSources={false}
        activeDataSourceIds={['test1']}
      />
    );
    expect(container).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally with data source filter', () => {
    const container = mount(
      <DataSourceAggregatedView
        fullWidth={false}
        hideLocalCluster={false}
        savedObjectsClient={client}
        notifications={toasts}
        displayAllCompatibleDataSources={true}
        dataSourceFilter={(ds) => ds.attributes.auth.type !== 'no_auth'}
      />
    );
    expect(container).toMatchSnapshot();
    expect(client.find).toBeCalledWith({
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
});
