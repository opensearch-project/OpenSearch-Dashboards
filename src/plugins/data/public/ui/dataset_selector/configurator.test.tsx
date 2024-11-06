/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Configurator } from './configurator'; // Adjust the import path as needed
import '@testing-library/jest-dom';
import React from 'react';
import { setQueryService, setIndexPatterns } from '../../services';
import { IntlProvider } from 'react-intl';

// Mocking the external service and hook functions
const mockGetQueryService = jest.fn();
const mockGetIndexPatterns = jest.fn();
const mockQueryService = {
  queryString: {
    getLanguageService: jest.fn().mockReturnValue({
      getLanguage: jest.fn().mockImplementation((langId) => ({
        title:
          {
            en: 'English',
            fr: 'French',
          }[langId] || 'Unknown', // Default to 'Unknown' if the language isn't found
        hideDatePicker: false, // Example behavior for showing date picker
      })),
    }),
    getQuery: jest.fn().mockReturnValue({
      language: 'en', // Default language for testing
    }),
    getDatasetService: jest.fn().mockReturnValue({
      getType: jest.fn().mockReturnValue({
        supportedLanguages: jest.fn().mockReturnValue(['en', 'fr']), // Mock supported languages
        indexedViewsService: {
          getIndexedViews: jest.fn().mockResolvedValue([
            { name: 'view1', type: 'type1' },
            { name: 'view2', type: 'type2' },
          ]), // Mock indexed views
        },
        fetchFields: jest.fn().mockResolvedValue([{ name: 'timestamp', type: 'date' }]), // Mock dataset fields
      }),
    }),
  },
};

const messages = {
  'app.welcome': 'Welcome to our application!',
  'app.logout': 'Log Out',
};

const mockIndexPatterns = {
  getPatterns: jest.fn().mockReturnValue([
    {
      id: 'pattern1',
      title: 'Index Pattern 1',
    },
  ]),
};

const mockServices = {
  datasetService: mockQueryService.queryString.getDatasetService(),
};

const mockBaseDataset = {
  title: 'Sample Dataset',
  type: 'index-pattern',
  timeFieldName: 'timestamp',
  dataSource: { meta: { supportsTimeFilter: true } },
};

const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();
const mockOnPrevious = jest.fn();

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  setQueryService(mockQueryService);
  setIndexPatterns(mockIndexPatterns);
});

describe('Configurator Component', () => {
  it('should render the component with the correct title and description', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        {/* Wrap with IntlProvider */}
        <Configurator
          services={mockServices}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    expect(screen.getByText('Step 2: Configure data')).toBeInTheDocument();
    expect(
      screen.getByText('Configure selected data based on parameters available.')
    ).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        {/* Wrap with IntlProvider */}
        <Configurator
          services={mockServices}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );
    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onPrevious when previous button is clicked', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        {/* Wrap with IntlProvider */}
        <Configurator
          services={mockServices}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    fireEvent.click(screen.getByText('Back'));

    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  it('should disable the submit button when conditions are not met', async () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <Configurator
          services={mockServices}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    const submitButton = screen.getByTestId('advancedSelectorConfirmButton');
    expect(submitButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Time field'), {
      target: { value: 'valid-time-field' },
    });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it('should update state correctly when language is selected', async () => {
    render(
      <IntlProvider locale="en" messages={{ 'app.welcome': 'Welcome' }}>
        <Configurator
          services={mockServices}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );
    const languageSelect = screen.getByText('English');
    expect(languageSelect).toBeInTheDocument(); // Check if the select element exists
    expect(languageSelect.value).toBe('en'); // Ensure the initial language is 'en'
    fireEvent.change(languageSelect, { target: { value: 'fr' } });
    await waitFor(() => {
      expect(languageSelect.value).toBe('fr'); // Ensure the language select value has changed to 'fr'
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
