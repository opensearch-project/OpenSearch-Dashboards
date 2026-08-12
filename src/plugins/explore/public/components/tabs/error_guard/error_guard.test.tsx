/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ErrorGuard } from './error_guard';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { EXPLORE_PATTERNS_TAB_ID } from '../../../../common';

// Mock the useTabError hook
jest.mock('../../../application/utils/hooks/use_tab_error', () => ({
  useTabError: jest.fn(),
}));

jest.mock('../../../application/utils/hooks/use_cannot_build_tab_query', () => ({
  useCannotBuildTabQuery: jest.fn(() => false),
}));

jest.mock('./patterns_error_guard', () => ({
  PatternsErrorGuard: () => <div>patterns empty state</div>,
}));

import { useTabError } from '../../../application/utils/hooks/use_tab_error';
import { useCannotBuildTabQuery } from '../../../application/utils/hooks/use_cannot_build_tab_query';

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

  it('renders the patterns empty state when the tab cannot build a query', () => {
    mockUseTabError.mockReturnValue(undefined);
    (useCannotBuildTabQuery as jest.Mock).mockReturnValue(true);

    render(
      <ErrorGuard registryTab={{ ...mockTabDefinition, id: EXPLORE_PATTERNS_TAB_ID }}>
        <div>child</div>
      </ErrorGuard>
    );

    expect(screen.getByText('patterns empty state')).toBeInTheDocument();
    expect(screen.queryByText('child')).not.toBeInTheDocument();
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
