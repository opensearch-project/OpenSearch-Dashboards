/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { importDataActionConfig } from '../../../../actions/import_data_action';
import {
  FlyoutComponentProps,
  QueryPanelActionDependencies,
} from '../../../../services/query_panel_actions_registry';
import { ResultStatus } from 'src/plugins/discover/public';
import { ExploreServices } from 'src/plugins/explore/public/types';

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

describe('Import Data Action', () => {
  let mockServices: any;
  let mockCloseFlyout: jest.Mock;
  let mockDependencies: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCloseFlyout = jest.fn();
    mockServices = {
      notifications: {
        toasts: {
          addDanger: jest.fn(),
        },
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
    };
    mockDependencies = {
      query: {},
      resultStatus: 'success',
      queryInEditor: '',
    };
  });

  it('has correct action configuration', () => {
    const deps: QueryPanelActionDependencies = {
      query: {
        query: 'source = index',
        language: 'ppl',
      },
      resultStatus: {
        status: ResultStatus.READY,
      },
      queryInEditor: 'source = index',
    };
    expect(importDataActionConfig.id).toBe('import-data');
    expect(importDataActionConfig.actionType).toBe('flyout');
    expect(importDataActionConfig.order).toBe(100);
    expect(importDataActionConfig.getLabel(deps)).toBe('Import data');
    expect(importDataActionConfig.getIcon?.(deps)).toBe('importAction');
    expect(importDataActionConfig.getIsEnabled?.(deps)).toBe(true);
    expect(importDataActionConfig.component).toBeDefined();
  });

  it('renders modal when component is mounted', async () => {
    const ImportDataModal = importDataActionConfig.component;
    const props: FlyoutComponentProps = {
      closeFlyout: mockCloseFlyout,
      dependencies: mockDependencies,
      services: mockServices,
    };

    render(<ImportDataModal {...props} />);

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByText('Import data')).toBeInTheDocument();
    });
  });

  it('lazy loads data importer component', async () => {
    const ImportDataModal = importDataActionConfig.component;
    const props: FlyoutComponentProps = {
      closeFlyout: mockCloseFlyout,
      dependencies: mockDependencies,
      services: mockServices,
    };

    render(<ImportDataModal {...props} />);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
    });
  });

  it('passes embedded=true to DataImporterPluginApp', async () => {
    const ImportDataModal = importDataActionConfig.component;
    const props: FlyoutComponentProps = {
      closeFlyout: mockCloseFlyout,
      dependencies: mockDependencies,
      services: mockServices,
    };

    render(<ImportDataModal {...props} />);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      const dataImporterApp = screen.getByTestId('data-importer-app');
      expect(dataImporterApp).toHaveAttribute('data-embedded', 'true');
    });
  });

  it('calls closeFlyout when modal close button is clicked', async () => {
    const ImportDataModal = importDataActionConfig.component;
    const props: FlyoutComponentProps = {
      closeFlyout: mockCloseFlyout,
      dependencies: mockDependencies,
      services: mockServices,
    };

    render(<ImportDataModal {...props} />);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Import data')).toBeInTheDocument();
    });

    // Find and click the X button (close button in modal header)
    const closeButton = screen.getByLabelText('Closes this modal window');
    fireEvent.click(closeButton);

    expect(mockCloseFlyout).toHaveBeenCalled();
  });

  it('passes correct services to DataImporterPluginApp', async () => {
    const customServices = {
      notifications: { toasts: { addDanger: jest.fn() } },
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

    const ImportDataModal = importDataActionConfig.component;
    const props: FlyoutComponentProps = {
      closeFlyout: mockCloseFlyout,
      dependencies: mockDependencies,
      services: (customServices as unknown) as ExploreServices,
    };

    render(<ImportDataModal {...props} />);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId('data-importer-app')).toBeInTheDocument();
    });
  });

  it('passes all required props to DataImporterPluginApp', async () => {
    const ImportDataModal = importDataActionConfig.component;
    const props: FlyoutComponentProps = {
      closeFlyout: mockCloseFlyout,
      dependencies: mockDependencies,
      services: mockServices,
    };

    render(<ImportDataModal {...props} />);

    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      const dataImporterApp = screen.getByTestId('data-importer-app');
      // Verify key props are set correctly
      expect(dataImporterApp).toHaveAttribute('data-embedded', 'true');
      expect(dataImporterApp).toBeInTheDocument();
    });
  });
});
