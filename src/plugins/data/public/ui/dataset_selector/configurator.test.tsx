/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Configurator } from './configurator';
import '@testing-library/jest-dom';
import React from 'react';
import { setQueryService, setIndexPatterns } from '../../services';
import { IntlProvider } from 'react-intl';
import { Query } from '../../../../data/public';

const getQueryMock = jest.fn().mockReturnValue({
  query: '',
  language: 'lucene',
  dataset: undefined,
} as Query);

const languageService = {
  getDefaultLanguage: () => ({ id: 'lucene', title: 'Lucene' }),
  getLanguages: () => [
    { id: 'lucene', title: 'Lucene' },
    { id: 'kuery', title: 'DQL' },
  ],
  getLanguage: (languageId: string) => {
    const languages = [
      { id: 'lucene', title: 'Lucene' },
      { id: 'kuery', title: 'DQL' },
    ];
    return languages.find((lang) => lang.id === languageId);
  },
  setUserQueryLanguage: jest.fn(),
};

const datasetService = {
  getType: jest.fn().mockReturnValue({
    fetchFields: jest.fn(),
    supportedLanguages: jest.fn().mockReturnValue(['kuery', 'lucene']),
    indexedViewsService: {
      getIndexedViews: jest.fn().mockResolvedValue([
        { name: 'view1', type: 'type1' },
        { name: 'view2', type: 'type2' },
      ]),
    },
  }),
  addRecentDataset: jest.fn(),
};

const fetchFieldsMock = jest.fn().mockResolvedValue([]);

const mockServices = {
  getQueryService: () => ({
    queryString: {
      getQuery: getQueryMock,
      getLanguageService: () => languageService,
      getDatasetService: () => datasetService,
      fetchFields: fetchFieldsMock,
      getUpdates$: jest.fn().mockReturnValue({
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      }),
    },
  }),
  getIndexPatterns: jest.fn().mockResolvedValue([
    {
      id: 'indexPattern1',
      attributes: {
        title: 'indexPattern1',
      },
    },
    {
      id: 'indexPattern2',
      attributes: {
        title: 'indexPattern2',
      },
    },
  ]),
};

const mockBaseDataset = {
  title: 'Sample Dataset',
  type: 'index-pattern',
  timeFieldName: 'timestamp',
  dataSource: { meta: { supportsTimeFilter: true } },
};

const messages = {
  'app.welcome': 'Welcome to our application!',
  'app.logout': 'Log Out',
};

const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();
const mockOnPrevious = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  setQueryService(mockServices.getQueryService());
  setIndexPatterns(mockServices.getIndexPatterns());
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
    const languageSelect = screen.getByText('Lucene');
    expect(languageSelect).toBeInTheDocument();
    expect(languageSelect.value).toBe('lucene');
    fireEvent.change(languageSelect, { target: { value: 'kuery' } });
    await waitFor(() => {
      expect(languageSelect.value).toBe('kuery');
    });
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should fetch indexed views on mount and display them', async () => {
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

    await waitFor(() => {
      expect(
        mockServices.getQueryService().queryString.getDatasetService().getType().indexedViewsService
          .getIndexedViews
      ).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('view1')).toBeInTheDocument();
      expect(screen.getByText('view2')).toBeInTheDocument();
    });
  });

  it('should initialize selectedLanguage with the current language from queryString', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Lucene')).toBeInTheDocument();
    });
  });

  it('should default selectedLanguage to the first language if currentLanguage is not supported', async () => {
    mockServices.getQueryService().queryString.getQuery.mockReturnValue({ language: 'de' });

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

    await waitFor(() => {
      expect(screen.getByText('Lucene')).toBeInTheDocument(); // Should default to 'Lucene'
    });
  });

  it('should display the supported language dropdown correctly', async () => {
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

    await waitFor(() => {
      expect(screen.getByText('Lucene')).toBeInTheDocument();
      expect(screen.getByText('DQL')).toBeInTheDocument();
    });
  });

  it('should disable the confirm button when submit is disabled', async () => {
    const mockIndexedViewsService = {
      getIndexedViews: jest.fn().mockResolvedValue([]),
    };

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

    const submitButton = screen.getByRole('button', { name: /select data/i });

    expect(submitButton).toBeDisabled();

    const languageSelect = screen.getByLabelText('Language');
    fireEvent.change(languageSelect, { target: { value: 'kuery' } });
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    const timeFieldSelect = screen.getByLabelText('Time field');
    fireEvent.change(timeFieldSelect, { target: { value: 'timestamp' } });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });
});
