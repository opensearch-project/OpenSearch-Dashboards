/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportDataButton } from './import_data_button';

// Mock opensearch-dashboards-react
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

// Mock DataImporterPluginApp component
jest.mock('../../../../../../data_importer/public', () => ({
  DataImporterPluginApp: ({ embedded }: { embedded: boolean }) => (
    <div data-test-subj="data-importer-app" data-embedded={embedded}>
      Data Importer App
    </div>
  ),
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

  it('opens modal when button is clicked', () => {
    render(<ImportDataButton />);

    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
  });

  it('passes embedded=true to DataImporterPluginApp', () => {
    render(<ImportDataButton />);

    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    const dataImporterApp = screen.getByTestId('data-importer-app');
    expect(dataImporterApp).toHaveAttribute('data-embedded', 'true');
  });

  it('closes modal when Done button is clicked', () => {
    render(<ImportDataButton />);

    // Open modal
    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);
    expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();

    // Close modal
    const doneButton = screen.getByText('Done');
    fireEvent.click(doneButton);

    expect(screen.queryByTestId('data-importer-app')).not.toBeInTheDocument();
  });

  it('closes modal when close button (X) is clicked', () => {
    render(<ImportDataButton />);

    // Open modal
    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);
    expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();

    // Find and click the X button (close button in modal header)
    const closeButton = screen.getByLabelText('Closes this modal window');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('data-importer-app')).not.toBeInTheDocument();
  });

  it('passes correct services to DataImporterPluginApp', () => {
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

    expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
  });

  it('passes all required props to DataImporterPluginApp', () => {
    // Use a more detailed mock to verify props
    const DataImporterPluginAppMock = jest.fn(
      ({ embedded, dataSourceEnabled, hideLocalCluster }) => (
        <div
          data-test-subj="data-importer-app"
          data-embedded={embedded}
          data-datasource-enabled={dataSourceEnabled}
          data-hide-local-cluster={hideLocalCluster}
        >
          Data Importer App
        </div>
      )
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../../../../../data_importer/public').DataImporterPluginApp = DataImporterPluginAppMock;

    render(<ImportDataButton />);

    const button = screen.getByTestId('exploreImportDataButton');
    fireEvent.click(button);

    expect(DataImporterPluginAppMock).toHaveBeenCalledWith(
      expect.objectContaining({
        embedded: true,
        dataSourceEnabled: false,
        hideLocalCluster: false,
        basename: '',
      }),
      expect.anything()
    );
  });
});
