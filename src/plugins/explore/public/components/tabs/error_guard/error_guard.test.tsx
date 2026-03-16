/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorGuard } from './error_guard';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';

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

describe('ErrorGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    mockUseTabError.mockReturnValue(null);

    render(
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

    render(
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

    render(
      <ErrorGuard registryTab={mockTabDefinition}>
        <div data-testid="child-content">Child Content</div>
      </ErrorGuard>
    );

    expect(screen.getByText('An error occurred while executing the query')).toBeInTheDocument();
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

    render(
      <ErrorGuard registryTab={mockTabDefinition}>
        <div data-testid="child-content">Child Content</div>
      </ErrorGuard>
    );

    expect(screen.getByText('Test error reason')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.queryByText('Type')).not.toBeInTheDocument();
  });
});
