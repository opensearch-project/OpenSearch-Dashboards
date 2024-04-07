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
  mockManagementPlugin,
} from '../../mocks';
import { render } from '@testing-library/react';
import * as utils from '../utils';

describe('DataSourceView', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  let client: SavedObjectsClientContract;
  const { toasts } = notificationServiceMock.createStartContract();
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const uiSettings = mockedContext.uiSettings;

  beforeEach(() => {
    jest.clearAllMocks();
    client = {
      get: jest.fn().mockResolvedValue([]),
    } as any;
    mockResponseForSavedObjectsCalls(client, 'get', getSingleDataSourceResponse);
  });

  it('should render normally with local cluster not hidden', async () => {
    spyOn(uiSettings, 'get').and.returnValue('test1');
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1', label: 'test1' }]}
        uiSettings={uiSettings}
      />
    );
    await component.instance().componentDidMount!();
    expect(uiSettings.get).toBeCalledWith('defaultDataSource', null);
    expect(component.state('selectedOption')).toEqual([{ id: 'test1', label: 'test1' }]);
    expect(component.state('defaultDataSource')).toEqual('test1');
    expect(component).toMatchSnapshot();
    expect(toasts.addWarning).toBeCalledTimes(0);
  });
  it('should show popover when click on button', async () => {
    const container = render(
      <DataSourceView fullWidth={false} selectedOption={[{ id: 'test1', label: 'test1' }]} />
    );
    const button = await container.findByTestId('dataSourceViewrButton');
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
    spyOn(utils, 'getDataSourceById').and.returnValue(undefined);
    spyOn(utils, 'handleDataSourceFetchError').and.returnValue('');
    component = shallow(
      <DataSourceView
        fullWidth={false}
        selectedOption={[{ id: 'test1' }]}
        savedObjectsClient={client}
        notifications={toasts}
      />
    );
    await component.instance().componentDidMount!();
    expect(component).toMatchSnapshot();
    mockErrorResponseForSavedObjectsCalls(client, 'get');
    expect(utils.getDataSourceById).toHaveBeenCalled();
    expect(utils.handleDataSourceFetchError).toHaveBeenCalled();
  });
});
