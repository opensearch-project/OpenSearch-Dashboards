/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, mount, shallow } from 'enzyme';
import React from 'react';
import { DataSourceAggregatedView } from './data_source_aggregated_view';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import { getDataSourcesWithFieldsResponse, mockResponseForSavedObjectsCalls } from '../../mocks';
import { render } from '@testing-library/react';

describe('DataSourceAggregatedView', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
  });

  it('should render normally with local cluster not hidden and all options', () => {
    component = shallow(
      <DataSourceAggregatedView
        fullWidth={false}
        hideLocalCluster={false}
        savedObjectsClient={client}
        notifications={toasts}
        displayAllCompatibleDataSources={true}
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
    const badge = container.find('EuiNotificationBadge').text();
    expect(badge).toEqual('0');
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
    const badge = container.find('EuiNotificationBadge').text();
    expect(badge).toEqual('1');
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
    const badge = container.find('EuiNotificationBadge').text();
    expect(badge).toEqual('All');
  });

  it('should render popup when clicking on info icon', async () => {
    const container = render(
      <DataSourceAggregatedView
        fullWidth={false}
        hideLocalCluster={false}
        savedObjectsClient={client}
        notifications={toasts}
        displayAllCompatibleDataSources={false}
        activeDataSourceIds={['test1']}
      />
    );
    const infoIcon = await container.findByTestId('dataSourceAggregatedViewInfoButton');
    infoIcon.click();
    expect(container).toMatchSnapshot();
  });
});
