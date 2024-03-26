/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import { SavedObjectsClientContract } from '../../../../../core/public';
import { notificationServiceMock } from '../../../../../core/public/mocks';
import React from 'react';
import { DataSourceMenu } from './data_source_menu';
import { render } from '@testing-library/react';
import { DataSourceComponentType } from './types';

describe('DataSourceMenu', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  let client: SavedObjectsClientContract;
  const notifications = notificationServiceMock.createStartContract();

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue([]),
    } as any;
  });

  it('should render data source selectable only with local cluster not hidden', () => {
    component = shallow(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceSelectable}
        componentConfig={{
          fullWidth: true,
          hideLocalCluster: false,
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
        componentConfig={{
          fullWidth: true,
          hideLocalCluster: true,
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
        componentConfig={{ fullWidth: true, hideLocalCluster: true }}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source aggregated view', () => {
    const container = render(
      <DataSourceMenu
        componentType={DataSourceComponentType.DataSourceAggregatedView}
        componentConfig={{
          fullWidth: true,
          hideLocalCluster: true,
          savedObjects: client,
          notifications,
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
          hideLocalCluster: true,
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
        showDataSourceMultiSelectable={true}
        appName={'myapp'}
        fullWidth={true}
        className={'myclass'}
        savedObjects={client}
        notifications={notifications}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
