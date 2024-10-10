/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { CoreStart } from 'src/core/public';
import { DataPublicPluginStart, IDataPluginServices } from '../..';
import { DataStorage, DataStructure } from '../../../common';
import { queryServiceMock } from '../../query/mocks';
import { getQueryService } from '../../services';
import { DatasetTable } from './dataset_table';

jest.mock('../../services', () => ({
  getQueryService: jest.fn(),
}));

describe('DataSetTable', () => {
  const mockQueryService = queryServiceMock.createSetupContract();
  const mockedTypeId = mockQueryService.queryString.getDatasetService().getType('test-type')?.id;

  const mockPath: DataStructure[] = [
    { id: 'root', title: 'Root', type: 'root' },
    { id: 'type1', title: 'Type 1', type: 'indexes' },
    {
      id: 'parent',
      title: 'Parent',
      type: 'cluster',
      children: [
        { id: 'child1', title: 'Child 1', type: 'index' },
        { id: 'child2', title: 'Child 2', type: 'index' },
      ],
      paginationToken: 'token',
      multiSelect: true,
    },
  ];

  const mockServices: IDataPluginServices = {
    appName: 'testApp',
    uiSettings: {} as CoreStart['uiSettings'],
    savedObjects: {} as CoreStart['savedObjects'],
    notifications: ({
      toasts: {
        addSuccess: jest.fn(),
        addError: jest.fn(),
      },
    } as unknown) as CoreStart['notifications'],
    http: {} as CoreStart['http'],
    storage: {} as DataStorage,
    data: {} as DataPublicPluginStart,
    overlays: ({
      openModal: jest.fn(),
    } as unknown) as CoreStart['overlays'],
  };

  const mockProps: ComponentProps<typeof DatasetTable> = {
    services: mockServices,
    path: mockPath,
    setPath: jest.fn(),
    index: 2,
    explorerDataset: undefined,
    selectDataStructure: jest.fn(),
    fetchNextDataStructure: jest.fn().mockResolvedValue([]),
  };

  const renderWithIntl = (component: React.ReactNode) =>
    render(<IntlProvider locale="en">{component}</IntlProvider>);

  beforeEach(() => {
    jest.clearAllMocks();
    (getQueryService as jest.Mock).mockReturnValue(mockQueryService);
  });

  it('renders the DataSetTable component', () => {
    renderWithIntl(<DatasetTable {...mockProps} />);

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Load more')).toBeInTheDocument();
  });

  it('calls selectDataStructure when an index is selected', async () => {
    renderWithIntl(<DatasetTable {...mockProps} />);

    const checkbox = screen.getByTestId('checkboxSelectRow-child1');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockProps.selectDataStructure).toHaveBeenCalledWith(
        {
          id: 'child1',
          title: 'Child 1',
          type: 'index',
        },
        mockPath.slice(0, mockPath.length)
      );
    });
  });

  it('calls selectDataStructure with undefined when all items are deselected', async () => {
    renderWithIntl(<DatasetTable {...mockProps} />);

    const checkbox1 = screen.getByTestId('checkboxSelectRow-child1');

    fireEvent.click(checkbox1);
    fireEvent.click(checkbox1);

    await waitFor(() => {
      expect(mockProps.selectDataStructure).toHaveBeenCalledWith(undefined, mockPath.slice(0, 3));
    });
  });

  it('calls onTableChange when search is performed', async () => {
    renderWithIntl(<DatasetTable {...mockProps} />);
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    expect(mockedTypeId).toBeDefined();

    await waitFor(() => {
      expect(mockProps.fetchNextDataStructure).toHaveBeenCalledWith(
        mockPath,
        mockedTypeId,
        expect.objectContaining({ search: 'test' })
      );
    });
  });

  it('calls onTableChange when Load more is clicked', async () => {
    renderWithIntl(<DatasetTable {...mockProps} />);
    fireEvent.click(screen.getByText('Load more'));

    await waitFor(() => {
      expect(mockProps.fetchNextDataStructure).toHaveBeenCalledWith(
        mockPath,
        mockedTypeId,
        expect.objectContaining({ paginationToken: 'token' })
      );
    });
  });
});
