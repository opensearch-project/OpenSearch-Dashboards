/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoreStart } from 'src/core/public';
import { DataPublicPluginStart, IDataPluginServices } from '../..';
import { DataStorage, DEFAULT_DATA, DataSource } from '../../../common';
import { DetailedDataset } from './dataset_select';
import { queryServiceMock } from '../../query/mocks';
import { getQueryService } from '../../services';
import { DatasetDetails, DatasetDetailsHeader, DatasetDetailsBody } from './dataset_details';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';

jest.mock('../../services', () => ({
  getQueryService: jest.fn(),
}));

describe('Dataset Details Components', () => {
  const mockNavigateToApp = jest.fn();
  const mockQueryService = queryServiceMock.createSetupContract();
  const mockDatasetServiceGetType = jest.fn();

  mockDatasetServiceGetType.mockReturnValue({
    id: 'index-pattern',
    title: 'Index Pattern',
    meta: {
      icon: {
        type: 'database',
      },
    },
  });

  mockQueryService.queryString.getDatasetService = jest.fn().mockReturnValue({
    getType: mockDatasetServiceGetType,
  });

  const mockServices: IDataPluginServices = {
    appName: 'testApp',
    uiSettings: {} as CoreStart['uiSettings'],
    savedObjects: {} as CoreStart['savedObjects'],
    notifications: {} as CoreStart['notifications'],
    http: {} as CoreStart['http'],
    storage: {} as DataStorage,
    data: ({
      query: {
        queryString: mockQueryService.queryString,
      },
    } as unknown) as DataPublicPluginStart,
    application: ({
      navigateToApp: mockNavigateToApp,
    } as unknown) as CoreStart['application'],
  };

  const mockDataset: DetailedDataset = {
    id: 'index-pattern-id',
    title: 'Test Index Pattern',
    displayName: 'Test Index Pattern Display Name',
    description: 'Test index pattern description',
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    timeFieldName: '@timestamp',
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    dataSource: {
      id: 'opensearch-datasource',
      title: 'OpenSearch DataSource',
      type: 'opensearch',
    },
    sourceDatasetRef: {
      id: 'source-id',
      type: 'index-pattern',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getQueryService as jest.Mock).mockReturnValue(mockQueryService);
  });

  describe('DatasetDetailsHeader', () => {
    it('renders the header with title', () => {
      render(<DatasetDetailsHeader dataset={mockDataset} isDefault={false} />);

      expect(screen.getByText('Test Index Pattern Display Name')).toBeInTheDocument();
    });

    it('renders the default badge when isDefault is true', () => {
      render(<DatasetDetailsHeader dataset={mockDataset} isDefault={true} />);

      expect(screen.getByTestId('datasetDetailsDefault')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('does not render when dataset is undefined', () => {
      const { container } = render(<DatasetDetailsHeader dataset={undefined} isDefault={false} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('DatasetDetailsBody', () => {
    const renderWithContext = (dataset = mockDataset, isDefault = false) => {
      return render(
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetDetailsBody dataset={dataset} isDefault={isDefault} />
        </OpenSearchDashboardsContextProvider>
      );
    };

    it('renders the dataset description', () => {
      renderWithContext();

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Test index pattern description')).toBeInTheDocument();
    });

    it('renders the data definition section', () => {
      renderWithContext();

      expect(screen.getByText('Data definition')).toBeInTheDocument();
      expect(screen.getByText('OpenSearch DataSource')).toBeInTheDocument();
    });

    it('renders the time field name', () => {
      renderWithContext();

      expect(screen.getByText('Time field')).toBeInTheDocument();
      expect(screen.getByText('@timestamp')).toBeInTheDocument();
    });

    it('navigates to data source when data definition is clicked', () => {
      renderWithContext();

      const dataDefinitionButton = screen.getByTestId('datasetDetailsDataDefinition');
      fireEvent.click(dataDefinitionButton);

      expect(mockNavigateToApp).toHaveBeenCalledWith('dataSources', {
        path: '/opensearch-datasource',
      });
    });

    it('does not navigate when dataset or dataSource is undefined', () => {
      renderWithContext({
        ...mockDataset,
        dataSource: (undefined as unknown) as DataSource,
      });

      const dataDefinitionButton = screen.getByTestId('datasetDetailsDataDefinition');
      fireEvent.click(dataDefinitionButton);

      expect(mockNavigateToApp).not.toHaveBeenCalled();
    });

    it('renders default datasource text when no datasource provided', () => {
      renderWithContext({
        ...mockDataset,
        dataSource: (undefined as unknown) as DataSource,
      });

      expect(screen.getByText('default')).toBeInTheDocument();
    });

    it('handles dataset without timeFieldName', () => {
      renderWithContext({
        ...mockDataset,
        timeFieldName: (undefined as unknown) as string,
      });

      expect(screen.getByText("I don't want to use a time filter")).toBeInTheDocument();
    });
  });

  describe('DatasetDetails', () => {
    it('renders the header and body when dataset is provided', () => {
      render(
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetDetails dataset={mockDataset} isDefault={false} />
        </OpenSearchDashboardsContextProvider>
      );

      expect(screen.getByText('Test Index Pattern Display Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Data definition')).toBeInTheDocument();
      expect(screen.getByText('Time field')).toBeInTheDocument();
    });

    it('renders with default className', () => {
      const { container } = render(
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetDetails dataset={mockDataset} isDefault={false} />
        </OpenSearchDashboardsContextProvider>
      );

      expect(container.querySelector('.datasetDetails__panel')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetDetails dataset={mockDataset} isDefault={false} className="custom-class" />
        </OpenSearchDashboardsContextProvider>
      );

      expect(container.querySelector('.datasetDetails__panel.custom-class')).toBeInTheDocument();
    });

    it('does not render when dataset is undefined', () => {
      const { container } = render(
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <DatasetDetails dataset={undefined} isDefault={false} />
        </OpenSearchDashboardsContextProvider>
      );

      expect(container.querySelector('Test Index Pattern Display Name')).not.toBeInTheDocument();
    });
  });
});
