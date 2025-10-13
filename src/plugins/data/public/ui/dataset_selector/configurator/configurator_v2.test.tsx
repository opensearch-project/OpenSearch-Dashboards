/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { BaseDataset } from '../../../../common';
import { setIndexPatterns, setQueryService } from '../../../services';
import { ConfiguratorV2 } from './configurator_v2';

const mockQueryService = {
  queryString: {
    getQuery: jest.fn().mockReturnValue({
      language: 'PPL',
    }),
    getLanguageService: () => ({
      getLanguage: (id: string) =>
        id === 'PPL' ? { id: 'PPL', title: 'PPL', supportedAppNames: ['explore'] } : undefined,
    }),
    getDatasetService: () => ({
      getType: jest.fn().mockReturnValue({
        fetchFields: jest.fn().mockResolvedValue([{ name: 'timestamp', type: 'date' }]),
        supportedLanguages: () => ['PPL'],
        meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
      }),
      cacheDataset: jest.fn(),
    }),
  },
};

const mockServices = {
  appName: 'explore',
  getQueryService: () => mockQueryService,
  getIndexPatterns: jest.fn().mockResolvedValue([]),
};

const mockBaseDataset: BaseDataset = {
  id: 'test-id',
  title: 'Test Dataset',
  type: 'index',
  dataSource: {
    id: 'ds-id',
    title: 'Test Datasource',
    type: 'DATA_SOURCE',
  },
};

const mockOnConfirm = jest.fn();
const mockOnCancel = jest.fn();
const mockOnPrevious = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  setQueryService(mockServices.getQueryService() as any);
  setIndexPatterns(mockServices.getIndexPatterns());
});

describe('ConfiguratorV2', () => {
  it('renders correctly', () => {
    render(
      <IntlProvider locale="en">
        <ConfiguratorV2
          services={mockServices as any}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    expect(screen.getByText('Step 2: Configure data')).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', () => {
    render(
      <IntlProvider locale="en">
        <ConfiguratorV2
          services={mockServices as any}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    fireEvent.click(screen.getByTestId('advancedSelectorCancelButton'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onPrevious when back is clicked', () => {
    render(
      <IntlProvider locale="en">
        <ConfiguratorV2
          services={mockServices as any}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    fireEvent.click(screen.getByText('Back'));
    expect(mockOnPrevious).toHaveBeenCalled();
  });

  it('displays PPL language', async () => {
    render(
      <IntlProvider locale="en">
        <ConfiguratorV2
          services={mockServices as any}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    const select = screen.getByTestId('advancedSelectorLanguageSelect');
    expect(select).toHaveValue('PPL');
  });

  it('shows time field select for non-index-pattern datasets', async () => {
    render(
      <IntlProvider locale="en">
        <ConfiguratorV2
          services={mockServices as any}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('advancedSelectorTimeFieldSelect')).toBeInTheDocument();
    });
  });

  it('disables confirm when time field not selected', async () => {
    render(
      <IntlProvider locale="en">
        <ConfiguratorV2
          services={mockServices as any}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('advancedSelectorConfirmButton')).toBeDisabled();
    });
  });

  it('shows save dataset checkbox', () => {
    render(
      <IntlProvider locale="en">
        <ConfiguratorV2
          services={mockServices as any}
          baseDataset={mockBaseDataset}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          onPrevious={mockOnPrevious}
        />
      </IntlProvider>
    );

    expect(screen.getByTestId('saveAsDatasetCheckbox')).toBeInTheDocument();
  });
});
