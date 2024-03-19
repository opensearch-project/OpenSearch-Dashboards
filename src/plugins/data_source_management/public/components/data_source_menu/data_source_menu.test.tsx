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
        showDataSourceSelectable={true}
        appName={'myapp'}
        savedObjects={client}
        notifications={notifications}
        fullWidth={true}
        hideLocalCluster={false}
        disableDataSourceSelectable={false}
        className={'myclass'}
        onDataSourcesSelectionChange={jest.fn()}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source selectable only with local cluster is hidden', () => {
    component = shallow(
      <DataSourceMenu
        showDataSourceSelectable={true}
        appName={'myapp'}
        savedObjects={client}
        notifications={notifications}
        fullWidth={true}
        hideLocalCluster={true}
        disableDataSourceSelectable={false}
        className={'myclass'}
        onDataSourcesSelectionChange={jest.fn()}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source view only', () => {
    component = shallow(
      <DataSourceMenu
        showDataSourceView={true}
        appName={'myapp'}
        fullWidth={true}
        className={'myclass'}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('should render data source aggregated view', () => {
    const container = render(
      <DataSourceMenu
        showDataSourceAggregatedView={true}
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
