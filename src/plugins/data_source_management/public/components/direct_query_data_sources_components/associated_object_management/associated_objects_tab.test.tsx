/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssociatedObjectsTab } from './associated_objects_tab';
import { ApplicationStart, HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { CatalogCacheManager } from '../../../../framework/catalog_cache/cache_manager';
import { DirectQueryLoadingStatus } from '../../../../framework/types';

// Mock the Date object to return a fixed date
const fixedDate = new Date('2024-07-21T12:00:00Z');
const OriginalDate = Date;

global.Date = jest.fn((...args) => {
  if (args.length) {
    return new OriginalDate(...args);
  }
  return fixedDate;
}) as any;

global.Date.now = OriginalDate.now;

// Mock toLocaleString to return a fixed string
// eslint-disable-next-line no-extend-native
Date.prototype.toLocaleString = jest.fn(() => '7/21/2024, 12:00:00 PM');

jest.mock('../../../plugin', () => ({
  getRenderCreateAccelerationFlyout: jest.fn(() => jest.fn()),
  getRenderAccelerationDetailsFlyout: jest.fn(() => jest.fn()),
  getRenderAssociatedObjectsDetailsFlyout: jest.fn(() => jest.fn()),
}));

jest.mock('../../../../framework/catalog_cache/cache_manager', () => ({
  CatalogCacheManager: {
    getOrCreateDataSource: jest.fn(),
    getDatabase: jest.fn(),
    getOrCreateAccelerationsByDataSource: jest.fn(),
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

const cacheLoadingHooks = {
  databasesLoadStatus: DirectQueryLoadingStatus.SUCCESS,
  startLoadingDatabases: jest.fn(),
  tablesLoadStatus: DirectQueryLoadingStatus.SUCCESS,
  startLoadingTables: jest.fn(),
  accelerationsLoadStatus: DirectQueryLoadingStatus.SUCCESS,
  startLoadingAccelerations: jest.fn(),
};

const datasource = {
  name: 'testDatasource',
};

const renderComponent = (props = {}) => {
  return render(
    <AssociatedObjectsTab
      datasource={datasource}
      cacheLoadingHooks={cacheLoadingHooks}
      selectedDatabase="testDatabase"
      setSelectedDatabase={jest.fn()}
      http={mockHttp as HttpStart}
      notifications={mockNotifications as NotificationsStart}
      application={mockApplication as ApplicationStart}
      {...props}
    />
  );
};

describe('AssociatedObjectsTab', () => {
  beforeEach(() => {
    (CatalogCacheManager.getOrCreateDataSource as jest.Mock).mockReturnValue({
      name: 'testDatasource',
      status: 'updated',
      databases: [{ name: 'testDatabase' }],
    });
    (CatalogCacheManager.getDatabase as jest.Mock).mockReturnValue({
      name: 'testDatabase',
      status: 'updated',
      tables: [{ name: 'testTable' }],
    });
    (CatalogCacheManager.getOrCreateAccelerationsByDataSource as jest.Mock).mockReturnValue({
      name: 'testDatasource',
      status: 'updated',
      accelerations: [],
    });
  });

  afterAll(() => {
    global.Date = OriginalDate;
  });

  test('renders without crashing', () => {
    renderComponent();
    expect(
      screen.getByText(/Manage objects associated with this data sources./i)
    ).toBeInTheDocument();
  });

  test('renders the header with the correct title and description', () => {
    renderComponent();
    expect(
      screen.getByText(/Manage objects associated with this data sources./i)
    ).toBeInTheDocument();
  });

  test('displays the loading state when data is being fetched', () => {
    cacheLoadingHooks.databasesLoadStatus = DirectQueryLoadingStatus.RUNNING;
    renderComponent();
    expect(screen.getByText(/Loading databases/i)).toBeInTheDocument();
  });

  test('displays the failure state when data fetching fails', () => {
    cacheLoadingHooks.databasesLoadStatus = DirectQueryLoadingStatus.FAILED;
    renderComponent();
    expect(screen.getByText(/Error loading databases/i)).toBeInTheDocument();
  });

  test('handles the refresh button click correctly', async () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Refresh/i));
    await waitFor(() => {
      expect(cacheLoadingHooks.startLoadingDatabases).toHaveBeenCalledWith({
        dataSourceName: 'testDatasource',
        dataSourceMDSId: undefined,
      });
    });
  });
});
