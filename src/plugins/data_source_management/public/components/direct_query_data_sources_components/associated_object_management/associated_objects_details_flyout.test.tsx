/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssociatedObjectsDetailsFlyout } from './associated_objects_details_flyout';
import { ApplicationStart, HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import {
  getRenderAccelerationDetailsFlyout,
  getRenderCreateAccelerationFlyout,
} from '../../../plugin';
import { CatalogCacheManager } from '../../../../framework/catalog_cache/cache_manager';
import { DirectQueryLoadingStatus } from '../../../../framework/types';
import { useLoadTableColumnsToCache } from '../../../../framework/catalog_cache/cache_loader';

jest.mock('../../../plugin', () => ({
  getRenderAccelerationDetailsFlyout: jest.fn(() => jest.fn()),
  getRenderCreateAccelerationFlyout: jest.fn(() => jest.fn()),
}));

jest.mock('../../../../framework/catalog_cache/cache_loader', () => ({
  useLoadTableColumnsToCache: jest.fn(),
}));

jest.mock('../../../../framework/catalog_cache/cache_manager', () => ({
  CatalogCacheManager: {
    getTable: jest.fn(),
  },
}));

const mockHttp: Partial<HttpStart> = {};
const mockNotifications: Partial<NotificationsStart> = {
  toasts: {
    addWarning: jest.fn(),
  },
};
const mockApplication: Partial<ApplicationStart> = {
  navigateToApp: jest.fn(),
};

const tableDetail = {
  datasource: 'testDatasource',
  database: 'testDatabase',
  name: 'testTable',
  type: 'table',
  accelerations: [],
};

const renderComponent = (props = {}) => {
  return render(
    <AssociatedObjectsDetailsFlyout
      tableDetail={tableDetail}
      datasourceName="testDatasource"
      resetFlyout={jest.fn()}
      http={mockHttp as HttpStart}
      notifications={mockNotifications as NotificationsStart}
      application={mockApplication as ApplicationStart}
      {...props}
    />
  );
};

describe('AssociatedObjectsDetailsFlyout', () => {
  beforeEach(() => {
    (useLoadTableColumnsToCache as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.SUCCESS,
      startLoading: jest.fn(),
    });
  });

  test('renders without crashing', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'testTable' })).toBeInTheDocument();
  });

  test('renders connection details', () => {
    renderComponent();
    expect(screen.getByText('Datasource connection')).toBeInTheDocument();
    expect(screen.getByText('testDatasource')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('testDatabase')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getAllByText('testTable').length).toBe(2); // One in the heading and one in the description
  });

  test('renders accelerations and schema tables', () => {
    renderComponent();
    expect(screen.getByText('Accelerations')).toBeInTheDocument();
    expect(screen.getByText('Schema')).toBeInTheDocument();
  });

  test('displays no data message for accelerations', () => {
    renderComponent();
    expect(screen.getByText('You have no accelerations')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const { asFragment } = renderComponent();
    expect(asFragment()).toMatchSnapshot();
  });

  test('Discover button click', async () => {
    renderComponent();
    fireEvent.click(screen.getAllByRole('button')[0]);
    await waitFor(() => {
      expect(mockApplication.navigateToApp).toHaveBeenCalledWith('data-explorer', {
        path:
          "discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_q=(filters:!(),query:(dataset:(dataSource:(id:'',meta:(name:testDatasource,type:CUSTOM),title:'',type:DATA_SOURCE),id:'::testDatasource.testDatabase.testTable',title:testDatasource.testDatabase.testTable,type:S3),language:SQL,query:'SELECT%20*%20FROM%20testDatasource.testDatabase.testTable%20LIMIT%2010'))",
      });
    });
  });

  test('Accelerate button click', async () => {
    const renderCreateAccelerationFlyout = jest.fn();
    (getRenderCreateAccelerationFlyout as jest.Mock).mockReturnValue(
      renderCreateAccelerationFlyout
    );

    renderComponent();
    fireEvent.click(screen.getAllByRole('button')[1]);
    await waitFor(() => {
      expect(renderCreateAccelerationFlyout).toHaveBeenCalled();
    });
  });
});
