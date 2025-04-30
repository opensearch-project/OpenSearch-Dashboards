/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { applicationServiceMock, notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { DataSourceMenu } from './data_source_menu';
import { render } from '@testing-library/react';
import { DataSourceComponentType } from './types';
import * as utils from '../utils';
import { DataSourceSelectionService } from '../../service/data_source_selection_service';
import { mockManagementPlugin } from '../../mocks';

describe('DataSourceMenu', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  let client: SavedObjectsClientContract;
  const notifications = notificationServiceMock.createStartContract();
  const application = applicationServiceMock.createStartContract();
  const dataSourceSelection = new DataSourceSelectionService();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
    spyOn(utils, 'getDataSourceSelection').and.returnValue(dataSourceSelection);
    mockedContext.workspaces.currentWorkspaceId$.getValue = jest
      .fn()
      .mockReturnValue('mock-workspace-id');
  });

  it('should render data source selectable only with local cluster not hidden', () => {
    component = shallow(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceSelectable}
        componentConfig={{
          fullWidth: true,
          onSelectedDataSources: jest.fn(),
          savedObjects: client,
          notifications,
        }}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source selectable only with local cluster is hidden', () => {
    component = shallow(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceSelectable}
        hideLocalCluster={true}
        componentConfig={{
          fullWidth: true,
          onSelectedDataSources: jest.fn(),
          savedObjects: client,
          notifications,
        }}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source view only', () => {
    component = shallow(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceView}
        componentConfig={{
          fullWidth: true,
          savedObjects: client,
          notifications,
        }}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source view if not pass saved object or notification', () => {
    component = shallow(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceView}
        componentConfig={{
          fullWidth: true,
          notifications,
        }}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('can render data source view when provide activeOption', () => {
    component = shallow(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceView}
        componentConfig={{
          fullWidth: true,
          savedObjects: client,
          notifications,
          activeOption: [{ id: 'test', label: 'test-label' }],
        }}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('can render data source view when only pass id in the activeOption', () => {
    component = shallow(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceView}
        componentConfig={{
          fullWidth: true,
          savedObjects: client,
          notifications,
          activeOption: [{ id: 'test' }],
        }}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source aggregated view', () => {
    jest.spyOn(utils, 'getApplication').mockReturnValue(application);
    const container = render(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceAggregatedView}
        componentConfig={{
          fullWidth: true,
          savedObjects: client,
          notifications,
          displayAllCompatibleDataSources: true,
        }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render nothing', () => {
    const container = render(
      <DataSourceMenu
        componentType={''}
        componentConfig={{
          fullWidth: true,
          savedObjects: client,
          notifications,
        }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render data source multi select component', () => {
    const container = render(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceMultiSelectable}
        componentConfig={{
          fullWidth: true,
          savedObjects: client,
          notifications,
        }}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
