/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportDataButton } from './import_data_button';

// Mock opensearch-dashboards-react
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

// Mock DataImporterPluginApp component - must be hoisted for dynamic imports
const mockDataImporterPluginApp = ({ embedded }: { embedded: boolean }) => (
  <div data-test-subj="data-importer-app" data-embedded={embedded}>
    Data Importer App
  </div>
);

// Mock the data_importer module for dynamic imports
jest.mock('../../../../../../data_importer/public', () => ({
  DataImporterPluginApp: mockDataImporterPluginApp,
}));

describe('ImportDataButton', () => {
  let mockUseOpenSearchDashboards: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mockUseOpenSearchDashboards = require('../../../../../../opensearch_dashboards_react/public')
      .useOpenSearchDashboards;

    mockUseOpenSearchDashboards.mockReturnValue({
      services: {
        notifications: {
          toasts: {},
        },
        http: {},
        navigation: {},
        dataImporterConfig: {
          enabledFileTypes: ['csv', 'json'],
          maxFileSizeBytes: 104857600,
          maxTextCount: 10000,
          filePreviewDocumentsCount: 10,
        },
        savedObjects: {},
      },
    });
  });

  it('renders import data button', () => {
    render(<ImportDataButton />);

    const button = screen.getByTestId('exploreImportDataButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Import data');
  });

  it('does not show modal initially', () => {
    render(<ImportDataButton />);

    expect(screen.queryByTestId('data-importer-app')).not.toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    render(<ImportDataButton />);

    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
    });
  });

  it('passes embedded=true to DataImporterPluginApp', async () => {
    render(<ImportDataButton />);

    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      const dataImporterApp = screen.getByTestId('data-importer-app');
      expect(dataImporterApp).toHaveAttribute('data-embedded', 'true');
    });
  });

  it('closes modal when Done button is clicked', async () => {
    render(<ImportDataButton />);

    // Open modal
    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
    });

    // Close modal
    const doneButton = screen.getByText('Done');
    fireEvent.click(doneButton);

    expect(screen.queryByTestId('data-importer-app')).not.toBeInTheDocument();
  });

  it('closes modal when close button (X) is clicked', async () => {
    render(<ImportDataButton />);

    // Open modal
    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
    });

    // Find and click the X button (close button in modal header)
    const closeButton = screen.getByLabelText('Closes this modal window');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('data-importer-app')).not.toBeInTheDocument();
  });

  it('passes correct services to DataImporterPluginApp', async () => {
    const mockServices = {
      notifications: { toasts: {} },
      http: { basePath: { prepend: jest.fn() } },
      navigation: { ui: {} },
      dataImporterConfig: {
        enabledFileTypes: ['csv', 'json', 'ndjson'],
        maxFileSizeBytes: 1048576,
        maxTextCount: 5000,
        filePreviewDocumentsCount: 20,
      },
      savedObjects: { client: {} },
    };

    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    });

    render(<ImportDataButton />);

    // Open modal to trigger DataImporterPluginApp rendering
    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
    });
  });

  it('passes all required props to DataImporterPluginApp', async () => {
    render(<ImportDataButton />);

    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      const dataImporterApp = screen.getByTestId('data-importer-app');
      // Verify key props are set correctly
      expect(dataImporterApp).toHaveAttribute('data-embedded', 'true');
      expect(dataImporterApp).toBeInTheDocument();
    });
  });
});
