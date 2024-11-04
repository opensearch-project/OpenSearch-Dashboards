/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpenSavedQueryFlyout } from './open_saved_query_flyout';
import savedQueryService from '../../query';

jest.mock('react-monaco-editor', () => {
  return ({ value, onChange }) => (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} />
  );
});

jest.mock('../../query', () => ({
  findSavedQueries: jest.fn(),
}));

const mockSavedQuery = {
  id: '1',
  attributes: {
    title: 'Test Query',
    description: 'A sample saved query',
    query: {
      language: 'SQL',
      dataset: { type: 'test_dataset' },
    },
    isTemplate: false,
  },
};

describe('OpenSavedQueryFlyout', () => {
  const onCloseMock = jest.fn();
  const onQueryOpenMock = jest.fn();
  const handleQueryDeleteMock = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (savedQueryService.findSavedQueries as jest.Mock).mockResolvedValue({
      queries: [mockSavedQuery],
    });
  });

  it('renders correctly and displays saved queries', async () => {
    render(
      <OpenSavedQueryFlyout
        savedQueryService={savedQueryService}
        onClose={onCloseMock}
        onQueryOpen={onQueryOpenMock}
        handleQueryDelete={handleQueryDeleteMock}
      />
    );

    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Saved queries' });
      expect(heading).toBeInTheDocument();
      expect(screen.getByText('Test Query')).toBeInTheDocument();
    });
  });
  it('fetches saved queries on mount', async () => {
    render(
      <OpenSavedQueryFlyout
        savedQueryService={savedQueryService}
        onClose={onCloseMock}
        onQueryOpen={onQueryOpenMock}
        handleQueryDelete={handleQueryDeleteMock}
      />
    );

    // Check that the service was called with the expected arguments
    expect(savedQueryService.findSavedQueries).toHaveBeenCalledWith('', 10000);

    await waitFor(() => {
      expect(screen.getByText('Test Query')).toBeInTheDocument();
    });
  });
});
