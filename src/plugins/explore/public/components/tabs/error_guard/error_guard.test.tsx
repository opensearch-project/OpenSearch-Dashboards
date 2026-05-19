/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ErrorGuard } from './error_guard';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';

// Mock the useTabError hook
jest.mock('../../../application/utils/hooks/use_tab_error', () => ({
  useTabError: jest.fn(),
}));

import { useTabError } from '../../../application/utils/hooks/use_tab_error';

const mockUseTabError = useTabError as jest.MockedFunction<typeof useTabError>;

const mockTabDefinition: TabDefinition = {
  id: 'test-tab',
  label: 'Test Tab',
  component: () => <div>Test Component</div>,
  flavor: ['logs'] as any,
  supportedLanguages: ['SQL'],
};

// Create a mock Redux store
const createMockStore = () =>
  configureStore({
    reducer: {
      query: () => ({ query: 'SELECT * FROM test' }),
    },
  });

// Create mock services
const createMockServices = () => ({
  core: {
    chat: {
      isAvailable: () => false,
    },
  },
  toastNotifications: {
    addWarning: jest.fn(),
  },
  contextProvider: {
    hooks: {
      useDynamicContext: () => '',
    },
  },
});

// Wrapper component with providers
const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  const services = createMockServices();

  return render(
    <Provider store={store}>
      <OpenSearchDashboardsContextProvider services={services}>
        {component}
      </OpenSearchDashboardsContextProvider>
    </Provider>
  );
};

describe('ErrorGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    mockUseTabError.mockReturnValue(null);

    renderWithProviders(
      <ErrorGuard registryTab={mockTabDefinition}>
        <div data-testid="child-content">Child Content</div>
      </ErrorGuard>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders error panel when there is an error', () => {
    const mockError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        reason: 'Test error reason',
        details: 'Test error details',
        type: 'test_error',
      },
      originalErrorMessage: 'Original error message',
    };

    mockUseTabError.mockReturnValue(mockError);

    renderWithProviders(
      <ErrorGuard registryTab={mockTabDefinition}>
        <div data-testid="child-content">Child Content</div>
      </ErrorGuard>
    );

    expect(screen.getByText('Test error reason')).toBeInTheDocument();
    expect(screen.getByText('Test error details')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('uses default error title when error reason is not provided', () => {
    const mockError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        details: 'Test error details',
        reason: '',
      },
      originalErrorMessage: 'Original error message',
    };

    mockUseTabError.mockReturnValue(mockError);

    renderWithProviders(
      <ErrorGuard registryTab={mockTabDefinition}>
        <div data-testid="child-content">Child Content</div>
      </ErrorGuard>
    );

    expect(screen.getByText('Query execution failed')).toBeInTheDocument();
  });

  it('does not render error type section when type is not provided', () => {
    const mockError = {
      statusCode: 400,
      error: 'Bad Request',
      message: {
        reason: 'Test error reason',
        details: 'Test error details',
      },
      originalErrorMessage: 'Original error message',
    };

    mockUseTabError.mockReturnValue(mockError);

    renderWithProviders(
      <ErrorGuard registryTab={mockTabDefinition}>
        <div data-testid="child-content">Child Content</div>
      </ErrorGuard>
    );

    expect(screen.getByText('Test error reason')).toBeInTheDocument();
    expect(screen.getByText('Test error details')).toBeInTheDocument();
    expect(screen.queryByText('Error type')).not.toBeInTheDocument();
  });
});
