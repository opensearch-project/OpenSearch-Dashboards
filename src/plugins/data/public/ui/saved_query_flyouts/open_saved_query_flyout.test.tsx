/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpenSavedQueryFlyout } from './open_saved_query_flyout';
import { createSavedQueryService } from '../../../public/query/saved_query/saved_query_service';
import { applicationServiceMock, uiSettingsServiceMock } from '../../../../../core/public/mocks';
import { SavedQueryAttributes } from '../../../public/query/saved_query/types';
import '@testing-library/jest-dom';
import { queryStringManagerMock } from '../../../../data/public/query/query_string/query_string_manager.mock';
import { getQueryService } from '../../services';

const savedQueryAttributesWithTemplate: SavedQueryAttributes = {
  title: 'foo',
  description: 'bar',
  query: {
    language: 'kuery',
    query: 'response:200',
    dataset: 'my_dataset',
  },
};

const mockSavedObjectsClient = {
  create: jest.fn(),
  error: jest.fn(),
  find: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

mockSavedObjectsClient.create.mockReturnValue({
  id: 'foo',
  attributes: {
    ...savedQueryAttributesWithTemplate,
    query: {
      ...savedQueryAttributesWithTemplate.query,
    },
  },
});

jest.mock('./saved_query_card', () => ({
  SavedQueryCard: ({
    savedQuery = {
      id: 'foo1',
      attributes: savedQueryAttributesWithTemplate,
    },
    onSelect,
    handleQueryDelete,
  }) => (
    <div>
      <div>{savedQuery?.attributes?.title}</div>
      <button onClick={() => onSelect(savedQuery)}>Select</button>
      <button onClick={() => handleQueryDelete(savedQuery)}>Delete</button>
    </div>
  ),
}));

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('../../services', () => ({
  getQueryService: jest.fn(),
}));

const mockSavedQueryService = createSavedQueryService(
  // @ts-ignore
  mockSavedObjectsClient,
  {
    application: applicationServiceMock.create(),
    uiSettings: uiSettingsServiceMock.createStartContract(),
  }
);

const mockHandleQueryDelete = jest.fn();
const mockOnQueryOpen = jest.fn();
const mockOnClose = jest.fn();

const savedQueries = [
  {
    id: '1',
    attributes: {
      title: 'Saved Query 1',
      description: 'Description for Query 1',
      query: { query: 'SELECT * FROM table1', language: 'sql' },
    },
  },
  {
    id: '2',
    attributes: {
      title: 'Saved Query 2',
      description: 'Description for Query 2',
      query: { query: 'SELECT * FROM table2', language: 'sql' },
    },
  },
];

jest.spyOn(mockSavedQueryService, 'getAllSavedQueries').mockResolvedValue(savedQueries);

describe('OpenSavedQueryFlyout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getQueryService as jest.Mock).mockReturnValue({
      queryString: queryStringManagerMock.createSetupContract(),
    });
  });

  it('should render the flyout with correct tabs and content', async () => {
    render(
      <OpenSavedQueryFlyout
        savedQueryService={mockSavedQueryService}
        onClose={mockOnClose}
        onQueryOpen={mockOnQueryOpen}
        handleQueryDelete={mockHandleQueryDelete}
      />
    );

    const savedQueriesTextElements = screen.getAllByText('Saved queries');

    expect(savedQueriesTextElements).toHaveLength(2);

    await waitFor(() => screen.getByPlaceholderText('Search'));

    await waitFor(() => screen.getByText('Saved Query 1'));
    await waitFor(() => screen.getByText('Saved Query 2'));

    const openQueryButton = screen.getByText('Open query');

    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'Saved Query 1' } });

    await waitFor(() => screen.getByText('Saved Query 1'));
    expect(screen.queryByText('Saved Query 2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Saved Query 1'));

    expect(openQueryButton).toBeEnabled();
  });

  it('should filter saved queries based on search input', async () => {
    render(
      <OpenSavedQueryFlyout
        savedQueryService={mockSavedQueryService}
        onClose={mockOnClose}
        onQueryOpen={mockOnQueryOpen}
        handleQueryDelete={mockHandleQueryDelete}
      />
    );

    await waitFor(() => screen.getByText('Saved Query 1'));
    await waitFor(() => screen.getByText('Saved Query 2'));

    const searchBar = screen.getByPlaceholderText('Search');
    fireEvent.change(searchBar, { target: { value: 'Saved Query 1' } });

    expect(screen.getByText('Saved Query 1')).toBeInTheDocument();
    expect(screen.queryByText('Saved Query 2')).toBeNull();
  });

  it('should select a query when clicking on it and enable the "Open query" button', async () => {
    render(
      <OpenSavedQueryFlyout
        savedQueryService={mockSavedQueryService}
        onClose={mockOnClose}
        onQueryOpen={mockOnQueryOpen}
        handleQueryDelete={mockHandleQueryDelete}
      />
    );

    await waitFor(() => screen.getByText('Saved Query 1'));

    fireEvent.click(screen.getByText('Saved Query 1'));

    expect(screen.getByText('Open query')).toBeEnabled();
  });

  it('should call handleQueryDelete when deleting a query', async () => {
    mockHandleQueryDelete.mockResolvedValueOnce();
    render(
      <OpenSavedQueryFlyout
        savedQueryService={mockSavedQueryService}
        onClose={mockOnClose}
        onQueryOpen={mockOnQueryOpen}
        handleQueryDelete={mockHandleQueryDelete}
      />
    );

    await waitFor(() => screen.getByText('Saved Query 1'));

    const deleteButtons = screen.getAllByText('Delete');

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockHandleQueryDelete).toHaveBeenCalledWith({
        id: '1',
        attributes: {
          description: 'Description for Query 1',
          query: {
            language: 'sql',
            query: 'SELECT * FROM table1',
          },
          title: 'Saved Query 1',
        },
      });
    });
    expect(mockHandleQueryDelete).toHaveBeenCalledTimes(1);
  });

  it('should handle pagination controls correctly', async () => {
    render(
      <OpenSavedQueryFlyout
        savedQueryService={mockSavedQueryService}
        onClose={mockOnClose}
        onQueryOpen={mockOnQueryOpen}
        handleQueryDelete={mockHandleQueryDelete}
      />
    );

    await waitFor(() => screen.getByText('Saved Query 1'));

    const pageSizeButton = await screen.findByText(/10/);
    fireEvent.click(pageSizeButton);

    expect(mockSavedQueryService.getAllSavedQueries).toHaveBeenCalled();
  });
});
