/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { DataSourceView } from './data_source_view';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import {
  getSingleDataSourceResponse,
  mockErrorResponseForSavedObjectsCalls,
  mockResponseForSavedObjectsCalls,
} from '../../mocks';
import { render } from '@testing-library/react';

describe('DataSourceView', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      get: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'get', getSingleDataSourceResponse);
  });

  it('should render normally with local cluster not hidden', () => {
    component = shallow(
      <DataSourceView fullWidth={false} selectedOption={[{ id: 'test1', label: 'test1' }]} />
    );
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
  it('should show popover when click on button', async () => {
    const container = render(
      <DataSourceView fullWidth={false} selectedOption={[{ id: 'test1', label: 'test1' }]} />
    );
    const button = await container.findByTestId('dataSourceViewContextMenuHeaderLink');
    button.click();
    expect(container).toMatchSnapshot();
  });
  it('should call getDataSourceById when only pass id no label', async () => {
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        savedObjectsClient={client}
        notifications={toasts}
      />
    );
    expect(component).toMatchSnapshot();
    expect(client.get).toBeCalledWith('data-source', 'test1');
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
  it('should call notification warning when there is data source fetch error', async () => {
    jest.mock('../utils', () => ({
      getDataSourceById: jest.fn(),
    }));
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        savedObjectsClient={client}
        notifications={toasts}
      />
    );
    expect(component).toMatchSnapshot();
    mockErrorResponseForSavedObjectsCalls(client, 'get');
    expect(toasts.addWarning).toBeCalledTimes(1);
    expect(toasts.addWarning).toBeCalledWith(`Failed to fetch data source`);
  });
});
