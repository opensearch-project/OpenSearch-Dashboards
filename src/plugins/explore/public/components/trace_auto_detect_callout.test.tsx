/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { coreMock } from '../../../../core/public/mocks';
import { TraceAutoDetectCallout } from './trace_auto_detect_callout';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../types';
import * as autoDetectModule from '../utils/auto_detect_trace_data';
import * as createDatasetsModule from '../utils/create_auto_datasets';

// Mock the utility functions
jest.mock('../utils/auto_detect_trace_data');
jest.mock('../utils/create_auto_datasets');

// Mock the DiscoverNoIndexPatterns component
jest.mock(
  '../application/legacy/discover/application/components/no_index_patterns/no_index_patterns',
  () => ({
    DiscoverNoIndexPatterns: () => <div data-testid="no-index-patterns">No Index Patterns</div>,
  })
);

describe('TraceAutoDetectCallout', () => {
  const mockCore = coreMock.createStart();
  let mockServices: Partial<ExploreServices>;
  const mockDetectTraceDataAcrossDataSources = autoDetectModule.detectTraceDataAcrossDataSources as jest.Mock;
  const mockCreateAutoDetectedDatasets = createDatasetsModule.createAutoDetectedDatasets as jest.Mock;

  // Setup localStorage mock
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock window.location.reload
  const mockReload = jest.fn();
  Object.defineProperty(window, 'location', {
    value: { reload: mockReload },
    writable: true,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockReload.mockClear();

    // Setup mock services
    mockServices = {
      savedObjects: mockCore.savedObjects,
      notifications: mockCore.notifications,
      indexPatterns: {
        getIds: jest.fn().mockResolvedValue([]),
        get: jest.fn(),
      } as any,
    };
  });

  const renderWithContext = () => {
    return render(
      <I18nProvider>
        <OpenSearchDashboardsContextProvider services={mockServices as ExploreServices}>
          <TraceAutoDetectCallout />
        </OpenSearchDashboardsContextProvider>
      </I18nProvider>
    );
  };

  it('should render DiscoverNoIndexPatterns when no trace data is detected', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([]);

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('No Index Patterns')).toBeInTheDocument();
    });
  });

  it('should render callout when trace data is detected', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Trace Data Detected')).toBeInTheDocument();
      expect(screen.getByText('otel-traces-*')).toBeInTheDocument();
    });
  });

  it('should render callout when trace and log data is detected', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: true,
        tracePattern: 'otel-traces-*',
        logPattern: 'otel-logs-*',
        traceTimeField: 'endTime',
        logTimeField: 'time',
      },
    ]);

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Trace Data Detected')).toBeInTheDocument();
      expect(screen.getByText('otel-traces-*')).toBeInTheDocument();
      expect(screen.getByText('otel-logs-*')).toBeInTheDocument();
    });
  });

  it('should respect localStorage dismissal', async () => {
    localStorageMock.setItem('explore:traces:autoDetectDismissed', 'true');

    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    // Mock indexPatterns to indicate there are trace datasets
    (mockServices.indexPatterns!.getIds as jest.Mock).mockResolvedValue(['test-id']);
    (mockServices.indexPatterns!.get as jest.Mock).mockResolvedValue({
      signalType: 'traces',
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('No Index Patterns')).toBeInTheDocument();
      expect(screen.queryByText('Trace Data Detected')).not.toBeInTheDocument();
    });
  });

  it('should clear dismissal if no trace datasets exist', async () => {
    localStorageMock.setItem('explore:traces:autoDetectDismissed', 'true');

    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    // Mock indexPatterns to indicate there are NO trace datasets
    (mockServices.indexPatterns!.getIds as jest.Mock).mockResolvedValue(['test-id']);
    (mockServices.indexPatterns!.get as jest.Mock).mockResolvedValue({
      signalType: 'logs', // Not traces
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Trace Data Detected')).toBeInTheDocument();
      expect(localStorageMock.getItem('explore:traces:autoDetectDismissed')).toBeNull();
    });
  });

  it('should dismiss callout when Dismiss button is clicked', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Trace Data Detected')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(localStorageMock.getItem('explore:traces:autoDetectDismissed')).toBe('true');
      expect(screen.getByText('No Index Patterns')).toBeInTheDocument();
    });
  });

  it('should create datasets when Create button is clicked', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: true,
        tracePattern: 'otel-traces-*',
        logPattern: 'otel-logs-*',
        traceTimeField: 'endTime',
        logTimeField: 'time',
      },
    ]);

    mockCreateAutoDetectedDatasets.mockResolvedValue({
      traceDatasetId: 'trace-id',
      logDatasetId: 'log-id',
      correlationId: 'correlation-id',
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Create Trace Datasets')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Trace Datasets');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateAutoDetectedDatasets).toHaveBeenCalledWith(
        mockServices.savedObjects!.client,
        expect.objectContaining({
          tracesDetected: true,
          logsDetected: true,
        })
      );
    });
  });

  it('should show success toast and reload after creating datasets', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    mockCreateAutoDetectedDatasets.mockResolvedValue({
      traceDatasetId: 'trace-id',
    });

    renderWithContext();

    // Wait for initial render and component to be ready
    await waitFor(() => {
      expect(screen.getByText('Create Trace Datasets')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Trace Datasets');
    fireEvent.click(createButton);

    // Wait for the create action to complete and verify toast is shown
    await waitFor(() => {
      expect(mockCore.notifications.toasts.addSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Trace datasets created',
        })
      );
    });

    // After successful creation, reload should eventually be called via setTimeout
    // Wait for the setTimeout (1500ms in component) to complete
    await waitFor(
      () => {
        expect(mockReload).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('should show error toast when dataset creation fails', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    const errorMessage = 'Failed to create datasets';
    mockCreateAutoDetectedDatasets.mockRejectedValue(new Error(errorMessage));

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Create Trace Datasets')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Trace Datasets');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCore.notifications.toasts.addDanger).toHaveBeenCalledWith({
        title: 'Failed to create datasets',
        text: errorMessage,
      });
    });
  });

  it('should clear dismissal flag after successful dataset creation', async () => {
    localStorageMock.setItem('explore:traces:autoDetectDismissed', 'true');

    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    // Mock to show no existing trace datasets so callout shows
    (mockServices.indexPatterns!.getIds as jest.Mock).mockResolvedValue([]);

    mockCreateAutoDetectedDatasets.mockResolvedValue({
      traceDatasetId: 'trace-id',
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Create Trace Datasets')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Trace Datasets');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(localStorageMock.getItem('explore:traces:autoDetectDismissed')).toBeNull();
    });
  });

  it('should handle detection failure gracefully', async () => {
    mockDetectTraceDataAcrossDataSources.mockRejectedValue(new Error('Detection failed'));

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('No Index Patterns')).toBeInTheDocument();
      expect(screen.queryByText('Trace Data Detected')).not.toBeInTheDocument();
    });

    // Should not show any error toast for detection failure
    expect(mockCore.notifications.toasts.addDanger).not.toHaveBeenCalled();
  });

  it('should disable create button while creating datasets', async () => {
    mockDetectTraceDataAcrossDataSources.mockResolvedValue([
      {
        tracesDetected: true,
        logsDetected: false,
        tracePattern: 'otel-traces-*',
        logPattern: null,
        traceTimeField: 'endTime',
        logTimeField: null,
      },
    ]);

    // Create a deferred promise that we can control
    let resolveCreation: (value: any) => void;
    const creationPromise = new Promise((resolve) => {
      resolveCreation = resolve;
    });

    // Mock a slow creation using deferred promise
    mockCreateAutoDetectedDatasets.mockImplementation(() => creationPromise);

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Create Trace Datasets')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Trace Datasets').closest('button');
    fireEvent.click(createButton!);

    // Button should be disabled while creation is in progress
    await waitFor(() => {
      expect(createButton).toBeDisabled();
      const loadingSpinner = createButton!.querySelector('.euiLoadingSpinner');
      expect(loadingSpinner).toBeInTheDocument();
    });

    // Resolve the creation promise to clean up
    resolveCreation!({ traceDatasetId: 'trace-id' });
  });
});
