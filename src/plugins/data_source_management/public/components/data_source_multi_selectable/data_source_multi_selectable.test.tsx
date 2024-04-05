/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import { getDataSourcesWithFieldsResponse, mockResponseForSavedObjectsCalls } from '../../mocks';
import { ShallowWrapper, shallow } from 'enzyme';
import { DataSourceMultiSelectable } from './data_source_multi_selectable';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

describe('DataSourceMultiSelectable', () => {
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
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
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

  it('should render normally with local cluster hidden', () => {
    component = shallow(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
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

  it('should show toasts when exception happens', async () => {
    const errorClient = {
      find: () => {
        return new Promise((resolve, reject) => {
          reject('error');
        });
      },
    } as any;

    component = shallow(
      <DataSourceMultiSelectable
        savedObjectsClient={errorClient}
        notifications={toasts}
        onSelectedDataSources={jest.fn()}
        hideLocalCluster={true}
        fullWidth={false}
      />
    );
    await nextTick();
    expect(toasts.addWarning).toBeCalledTimes(1);
  });

  it('should callback when onChange happens', async () => {
    const callbackMock = jest.fn();
    const container = render(
      <DataSourceMultiSelectable
        savedObjectsClient={client}
        notifications={toasts}
        onSelectedDataSources={callbackMock}
        hideLocalCluster={true}
        fullWidth={false}
      />
    );
    const button = await container.findByTestId('dataSourceFilterGroupButton');
    button.click();
    fireEvent.click(screen.getByText('Deselect all'));

    expect(callbackMock).toBeCalledWith([]);
  });
});
