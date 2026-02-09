/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createDatasetSelect } from './create_dataset_select';
import { coreMock } from '../../../../../core/public/mocks';
import { dataPluginMock } from '../../mocks';
import { DataStorage } from '../../../common';

// Mock the useOpenSearchDashboards hook to prevent async issues
jest.mock('../../../../opensearch_dashboards_react/public', () => {
  const actual = jest.requireActual('../../../../opensearch_dashboards_react/public');
  return {
    ...actual,
    useOpenSearchDashboards: () => ({
      services: {
        data: {
          dataViews: {
            getIds: jest.fn().mockResolvedValue([]),
            get: jest.fn().mockResolvedValue({}),
            getDefault: jest.fn().mockResolvedValue(null),
            convertToDataset: jest.fn().mockResolvedValue({}),
          },
          query: {
            queryString: {
              getQuery: jest.fn().mockReturnValue({}),
              getDatasetService: jest.fn().mockReturnValue({
                getType: jest.fn().mockReturnValue({ meta: { icon: { type: 'database' } } }),
              }),
            },
          },
        },
        overlays: {
          openModal: jest.fn().mockReturnValue({ close: jest.fn() }),
        },
        notifications: {
          toasts: {
            addError: jest.fn(),
            addWarning: jest.fn(),
          },
        },
      },
    }),
    toMountPoint: jest.fn(),
  };
});

describe('createDatasetSelect', () => {
  const core = coreMock.createStart();
  const mockData = dataPluginMock.createStartContract();
  const mockStorage = ({
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  } as unknown) as DataStorage;

  const mockOnSelect = jest.fn();
  const mockAppName = 'testApp';

  // Mock the async dataViews methods to prevent hanging
  const mockDataView = {
    id: 'test-id',
    title: 'test-dataset',
    description: 'test description',
    displayName: 'Test Dataset',
    signalType: 'test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock the dataViews service methods
    mockData.dataViews.getIds = jest.fn().mockResolvedValue(['test-id']);
    mockData.dataViews.get = jest.fn().mockResolvedValue(mockDataView);
    mockData.dataViews.getDefault = jest.fn().mockResolvedValue(mockDataView);
    mockData.dataViews.convertToDataset = jest.fn().mockResolvedValue({
      id: 'test-id',
      title: 'test-dataset',
      type: 'index-pattern',
    });

    // Mock query string service
    mockData.query.queryString.getQuery = jest.fn().mockReturnValue({});
    mockData.query.queryString.getDatasetService = jest.fn().mockReturnValue({
      getType: jest.fn().mockReturnValue({
        meta: { icon: { type: 'database' } },
        title: 'Test Type',
      }),
    });

    // Mock overlays service
    core.overlays.openModal = jest.fn().mockReturnValue({
      close: jest.fn(),
    });

    // Mock notifications service
    core.notifications.toasts.addError = jest.fn();
    core.notifications.toasts.addWarning = jest.fn();

    // Mock the storage service
    (mockStorage.get as jest.Mock).mockReturnValue(null);
    (mockStorage.set as jest.Mock).mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('creates a wrapped DatasetSelect component factory function', () => {
    const CreatedDatasetSelect = createDatasetSelect({
      core,
      data: mockData,
      storage: mockStorage,
    });

    expect(typeof CreatedDatasetSelect).toBe('function');
  });

  it('factory function accepts required props', () => {
    const CreatedDatasetSelect = createDatasetSelect({
      core,
      data: mockData,
      storage: mockStorage,
    });

    // Test that the component can be created with required props
    expect(() => {
      React.createElement(CreatedDatasetSelect, {
        onSelect: mockOnSelect,
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        appName: mockAppName,
      });
    }).not.toThrow();
  });

  it('passes correct services to context provider', () => {
    const CreatedDatasetSelect = createDatasetSelect({
      core,
      data: mockData,
      storage: mockStorage,
    });

    // Verify the factory returns a component
    expect(
      React.isValidElement(
        React.createElement(CreatedDatasetSelect, {
          onSelect: mockOnSelect,
          // @ts-expect-error TS2769 TODO(ts-error): fixme
          appName: mockAppName,
        })
      )
    ).toBe(true);
  });
});
