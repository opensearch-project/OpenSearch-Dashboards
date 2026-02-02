/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatternsSettingsPopoverContent } from './patterns_settings_popover_content';
import { useDispatch, useSelector } from 'react-redux';
import { useDatasetContext } from '../../../../application/context/dataset_context/dataset_context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { setPatternsField } from '../../../../application/utils/state_management/slices/tab/tab_slice';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
  connect: jest.fn(() => (Component: React.ComponentType<any>) => Component),
}));

jest.mock('../../../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

jest.mock('../../../../application/utils/state_management/slices/tab/tab_slice', () => ({
  setPatternsField: jest.fn(() => ({ type: 'test/setPatternsField' })),
}));

jest.mock('../../../../application/utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn(() => ({ type: 'test/executeQueries' })),
}));

describe('PatternsSettingsPopoverContent', () => {
  const mockDispatch = jest.fn();
  const mockFieldChange = jest.fn();
  const mockServices = {
    data: {},
    notifications: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });
  });

  it('renders loading spinner when dataset is loading', () => {
    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: undefined,
      isLoading: true,
      error: null,
    });
    (useSelector as jest.Mock).mockReturnValue('field1');

    render(<PatternsSettingsPopoverContent />);

    const spinner = document.querySelector('.euiLoadingSpinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders error message when there is an error loading dataset', () => {
    const errorMessage = 'Failed to load dataset';
    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: undefined,
      isLoading: false,
      error: errorMessage,
    });
    (useSelector as jest.Mock).mockReturnValue('field1');

    render(<PatternsSettingsPopoverContent />);

    expect(screen.getByText('Error loading dataset')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders select with options when dataset is loaded', () => {
    const mockDataset = {
      fields: {
        getAll: jest.fn().mockReturnValue([
          { name: 'field1', scripted: false, esTypes: ['text'], type: 'string' },
          { name: 'field2', scripted: false, esTypes: ['keyword'], type: 'string' },
          { name: 'field3', scripted: true, esTypes: ['text'], type: 'string' },
          { name: 'field4', scripted: false, esTypes: ['integer'], type: 'number' },
          {
            name: 'field5',
            scripted: false,
            esTypes: ['text'],
            subType: 'some-subtype',
            type: 'string',
          }, // Should be filtered out (has subType)
        ]),
      },
      metaFields: ['_id', '_source'],
    };

    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });
    (useSelector as jest.Mock).mockReturnValue('field1');

    render(<PatternsSettingsPopoverContent />);

    expect(screen.getByText('Patterns Field')).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Only field1 and field2 should be in the options (others filtered out)
    expect(select).toHaveValue('field1');
  });

  it('selects first option when patternsField is not in options', () => {
    const mockDataset = {
      fields: {
        getAll: jest.fn().mockReturnValue([
          { name: 'field1', scripted: false, esTypes: ['text'], type: 'string' },
          { name: 'field2', scripted: false, esTypes: ['keyword'], type: 'string' },
        ]),
      },
      metaFields: [],
    };

    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });

    // Set a patterns field that doesn't exist in the options
    (useSelector as jest.Mock).mockReturnValue('nonexistent_field');

    render(<PatternsSettingsPopoverContent />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('field1'); // Should default to first option
  });

  it('dispatches setPatternsField and executeQueries when field changes', async () => {
    const mockDataset = {
      fields: {
        getAll: jest.fn().mockReturnValue([
          { name: 'field1', scripted: false, esTypes: ['text'], type: 'string' },
          { name: 'field2', scripted: false, esTypes: ['keyword'], type: 'string' },
        ]),
      },
      metaFields: [],
    };

    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });
    (useSelector as jest.Mock).mockReturnValue('field1');

    render(<PatternsSettingsPopoverContent fieldChange={mockFieldChange} />);

    const select = screen.getByRole('combobox');

    // Change the selected field
    await userEvent.selectOptions(select, 'field2');

    // Check if setPatternsField was dispatched with the new value
    expect(setPatternsField).toHaveBeenCalledWith('field2');

    // Wait for the Promise.resolve().then() to complete
    await waitFor(() => {
      // Check if executeQueries was dispatched with the services
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      // Check if fieldChange callback was called
      expect(mockFieldChange).toHaveBeenCalled();
    });
  });

  it('handles empty dataset fields gracefully', () => {
    const mockDataset = {
      fields: {
        getAll: jest.fn().mockReturnValue([]),
      },
      metaFields: [],
    };

    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });
    (useSelector as jest.Mock).mockReturnValue(undefined);

    render(<PatternsSettingsPopoverContent />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children.length).toBe(0); // No options
  });

  it('handles undefined dataset gracefully', () => {
    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: undefined,
      isLoading: false,
      error: null,
    });
    (useSelector as jest.Mock).mockReturnValue(undefined);

    render(<PatternsSettingsPopoverContent />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children.length).toBe(0); // No options
  });

  it('calls fieldChange callback when provided', async () => {
    const mockDataset = {
      fields: {
        getAll: jest.fn().mockReturnValue([
          { name: 'field1', scripted: false, esTypes: ['text'], type: 'string' },
          { name: 'field2', scripted: false, esTypes: ['keyword'], type: 'string' },
        ]),
      },
      metaFields: [],
    };

    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });
    (useSelector as jest.Mock).mockReturnValue('field1');

    render(<PatternsSettingsPopoverContent fieldChange={mockFieldChange} />);

    const select = screen.getByRole('combobox');

    // Change the selected field
    await userEvent.selectOptions(select, 'field2');

    // Wait for the Promise.resolve().then() to complete
    await waitFor(() => {
      expect(mockFieldChange).toHaveBeenCalled();
    });
  });

  it('works without fieldChange callback', async () => {
    const mockDataset = {
      fields: {
        getAll: jest.fn().mockReturnValue([
          { name: 'field1', scripted: false, esTypes: ['text'], type: 'string' },
          { name: 'field2', scripted: false, esTypes: ['keyword'], type: 'string' },
        ]),
      },
      metaFields: [],
    };

    (useDatasetContext as jest.Mock).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });
    (useSelector as jest.Mock).mockReturnValue('field1');

    render(<PatternsSettingsPopoverContent />);

    const select = screen.getByRole('combobox');

    // Change the selected field
    await userEvent.selectOptions(select, 'field2');

    // Wait for the Promise.resolve().then() to complete
    await waitFor(() => {
      // Check if executeQueries was dispatched with the services
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      // No error should be thrown even without fieldChange callback
    });
  });
});
