/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import { DataSourceSelector } from './data_source_selector';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { getDataSourcesWithFieldsResponse, mockResponseForSavedObjectsCalls } from '../../mocks';
import { AuthType } from 'src/plugins/data_source/common/data_sources';

describe('DataSourceSelector', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
  });

  it('should render normally with local cluster not hidden', () => {
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
      fields: ['id', 'title', 'auth.type'],
      perPage: 10000,
      type: 'data-source',
    });
    expect(toasts.addWarning).toBeCalledTimes(0);
  });

  it('should render normally with local cluster is hidden', () => {
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
      fields: ['id', 'title', 'auth.type'],
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

  beforeEach(async () => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;

    mockResponseForSavedObjectsCalls(client, 'find', getDataSourcesWithFieldsResponse);
  });

  it('should always place local cluster option as the first option when local cluster not hidden', async () => {
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
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
});
