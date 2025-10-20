/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAssistantAction } from '../../../context_provider/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { useNavigateAction } from './navigate_action';

// Mock dependencies
jest.mock('../../../context_provider/public');
jest.mock('../../../opensearch_dashboards_react/public');

describe('useNavigateAction', () => {
  let mockUseAssistantAction: jest.MockedFunction<typeof useAssistantAction>;
  let mockUseOpenSearchDashboards: jest.MockedFunction<typeof useOpenSearchDashboards>;
  let registeredAction: any;
  let mockNavigateToApp: jest.Mock;
  let mockServices: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock navigation service
    mockNavigateToApp = jest.fn();
    mockServices = {
      core: {
        application: {
          navigateToApp: mockNavigateToApp,
        },
      },
    };

    // Mock hooks
    mockUseAssistantAction = useAssistantAction as jest.MockedFunction<typeof useAssistantAction>;
    mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
      typeof useOpenSearchDashboards
    >;

    // Setup useOpenSearchDashboards mock
    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    });

    // Capture the registered action
    mockUseAssistantAction.mockImplementation((action) => {
      registeredAction = action;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('action registration', () => {
    it('should register action with correct name and description', () => {
      // Component that uses the hook
      const TestComponent = () => {
        useNavigateAction();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockUseAssistantAction).toHaveBeenCalledWith({
        name: 'navigate_to_page',
        description:
          'Navigate the user to a different page within OpenSearch Dashboards. Use this when you need to take the user to a specific dashboard, discover page, or other application.',
        parameters: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            appId: expect.objectContaining({
              type: 'string',
              description:
                'The OpenSearch Dashboards application to navigate to (e.g., "management", "visualize", "discover", "dashboard", "explore")',
            }),
            path: expect.objectContaining({
              type: 'string',
              description:
                'Optional path within the application (e.g., "#/saved-objects", "/create", "?query=example")',
            }),
            description: expect.objectContaining({
              type: 'string',
              description:
                'Optional user-friendly description of the destination (e.g., "Visualization Builder", "Index Management")',
            }),
          }),
          required: ['appId'],
        }),
        handler: expect.any(Function),
        render: expect.any(Function),
      });
    });

    it('should have correct parameter schema structure', () => {
      const TestComponent = () => {
        useNavigateAction();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      const actionCall = mockUseAssistantAction.mock.calls[0][0];
      expect(actionCall.parameters.type).toBe('object');
      expect(actionCall.parameters.required).toEqual(['appId']);
      expect(Object.keys(actionCall.parameters.properties)).toEqual([
        'appId',
        'path',
        'description',
      ]);
    });
  });

  describe('handler function', () => {
    beforeEach(() => {
      const TestComponent = () => {
        useNavigateAction();
        return <div>Test</div>;
      };
      render(<TestComponent />);
    });

    describe('valid navigation scenarios', () => {
      it('should handle navigation with appId only', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const result = await registeredAction.handler({
          appId: 'dashboard',
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('dashboard', undefined);
        expect(result).toEqual({
          success: true,
          navigated_to: 'dashboard',
          path: '',
          description: 'Navigated to dashboard',
          timestamp: expect.any(Number),
        });
      });

      it('should handle navigation with appId and path', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const result = await registeredAction.handler({
          appId: 'management',
          path: '#/saved-objects',
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('management', { path: '#/saved-objects' });
        expect(result).toEqual({
          success: true,
          navigated_to: 'management',
          path: '#/saved-objects',
          description: 'Navigated to management (#/saved-objects)',
          timestamp: expect.any(Number),
        });
      });

      it('should handle navigation with all parameters', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const result = await registeredAction.handler({
          appId: 'visualize',
          path: '/create',
          description: 'Visualization Builder',
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('visualize', { path: '/create' });
        expect(result).toEqual({
          success: true,
          navigated_to: 'visualize',
          path: '/create',
          description: 'Visualization Builder',
          timestamp: expect.any(Number),
        });
      });

      it('should handle empty path correctly', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const result = await registeredAction.handler({
          appId: 'discover',
          path: '',
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('discover', undefined);
        expect(result).toEqual({
          success: true,
          navigated_to: 'discover',
          path: '',
          description: 'Navigated to discover',
          timestamp: expect.any(Number),
        });
      });
    });

    describe('parameter validation', () => {
      it('should reject missing appId', async () => {
        const result = await registeredAction.handler({});

        expect(mockNavigateToApp).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          error: 'appId is required and must be a string',
          attempted_app: undefined,
          attempted_path: undefined,
          timestamp: expect.any(Number),
        });
      });

      it('should reject null appId', async () => {
        const result = await registeredAction.handler({
          appId: null,
        });

        expect(mockNavigateToApp).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          error: 'appId is required and must be a string',
          attempted_app: null,
          attempted_path: undefined,
          timestamp: expect.any(Number),
        });
      });

      it('should reject non-string appId', async () => {
        const result = await registeredAction.handler({
          appId: 123,
        });

        expect(mockNavigateToApp).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          error: 'appId is required and must be a string',
          attempted_app: 123,
          attempted_path: undefined,
          timestamp: expect.any(Number),
        });
      });

      it('should reject empty string appId', async () => {
        const result = await registeredAction.handler({
          appId: '',
        });

        expect(mockNavigateToApp).not.toHaveBeenCalled();
        expect(result).toEqual({
          success: false,
          error: 'appId is required and must be a string',
          attempted_app: '',
          attempted_path: undefined,
          timestamp: expect.any(Number),
        });
      });
    });

    describe('navigation service errors', () => {
      it('should handle navigation service rejection', async () => {
        const navigationError = new Error('Navigation failed');
        mockNavigateToApp.mockRejectedValueOnce(navigationError);

        const result = await registeredAction.handler({
          appId: 'invalid-app',
          path: '/some-path',
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('invalid-app', { path: '/some-path' });
        expect(result).toEqual({
          success: false,
          error: 'Navigation failed',
          attempted_app: 'invalid-app',
          attempted_path: '/some-path',
          timestamp: expect.any(Number),
        });
      });

      it('should handle non-Error navigation failures', async () => {
        mockNavigateToApp.mockRejectedValueOnce('String error');

        const result = await registeredAction.handler({
          appId: 'test-app',
        });

        expect(result).toEqual({
          success: false,
          error: undefined, // String errors don't have .message property
          attempted_app: 'test-app',
          attempted_path: undefined,
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe('render function', () => {
    beforeEach(() => {
      const TestComponent = () => {
        useNavigateAction();
        return <div>Test</div>;
      };
      render(<TestComponent />);
    });

    it('should render null when no args provided', () => {
      const { container } = render(
        <div>{registeredAction.render({ status: 'complete', args: null, result: null })}</div>
      );

      expect(container.firstChild?.textContent).toBe('');
    });

    describe('executing status', () => {
      it('should render executing status with basic navigation info', () => {
        const args = {
          appId: 'dashboard',
        };

        render(<div>{registeredAction.render({ status: 'executing', args, result: null })}</div>);

        expect(screen.getByText('Navigating...')).toBeInTheDocument();
        expect(screen.getByText('Taking you to: dashboard')).toBeInTheDocument();
      });

      it('should render executing status with path', () => {
        const args = {
          appId: 'management',
          path: '#/saved-objects',
        };

        render(<div>{registeredAction.render({ status: 'executing', args, result: null })}</div>);

        expect(screen.getByText('Navigating...')).toBeInTheDocument();
        expect(screen.getByText('Taking you to: management (#/saved-objects)')).toBeInTheDocument();
      });

      it('should render executing status with description', () => {
        const args = {
          appId: 'visualize',
          description: 'Visualization Builder',
        };

        render(<div>{registeredAction.render({ status: 'executing', args, result: null })}</div>);

        expect(screen.getByText('Taking you to: Visualization Builder')).toBeInTheDocument();
      });

      it('should render executing status with description and path', () => {
        const args = {
          appId: 'explore',
          path: '/create',
          description: 'Data Explorer',
        };

        render(<div>{registeredAction.render({ status: 'executing', args, result: null })}</div>);

        expect(screen.getByText('Taking you to: Data Explorer (/create)')).toBeInTheDocument();
      });
    });

    describe('complete status', () => {
      it('should render success state', () => {
        const args = {
          appId: 'dashboard',
        };

        const result = {
          success: true,
          navigated_to: 'dashboard',
          path: '',
          description: 'Navigated to dashboard',
          timestamp: Date.now(),
        };

        render(<div>{registeredAction.render({ status: 'complete', args, result })}</div>);

        expect(screen.getByText('✓ Redirecting...')).toBeInTheDocument();
      });

      it('should render failure state with error message', () => {
        const args = {
          appId: 'invalid-app',
          path: '/test',
        };

        const result = {
          success: false,
          error: 'Navigation failed',
          attempted_app: 'invalid-app',
          attempted_path: '/test',
          timestamp: Date.now(),
        };

        render(<div>{registeredAction.render({ status: 'complete', args, result })}</div>);

        expect(screen.getByText('✗ Navigation failed: Navigation failed')).toBeInTheDocument();
        expect(screen.getByText(/Attempted URL:/)).toBeInTheDocument();
      });

      it('should handle complete status without result', () => {
        const args = {
          appId: 'dashboard',
        };

        const { container } = render(
          <div>{registeredAction.render({ status: 'complete', args, result: null })}</div>
        );

        expect(container.firstChild?.textContent).toBe('');
      });
    });

    describe('failed status', () => {
      it('should render failed status with error', () => {
        const args = {
          appId: 'test-app',
        };

        const error = new Error('Action failed');

        render(
          <div>{registeredAction.render({ status: 'failed', args, result: null, error })}</div>
        );

        expect(screen.getByText('✗ Navigate tool error: Action failed')).toBeInTheDocument();
      });

      it('should handle failed status without error', () => {
        const args = {
          appId: 'test-app',
        };

        const { container } = render(
          <div>{registeredAction.render({ status: 'failed', args, result: null })}</div>
        );

        expect(container.firstChild?.textContent).toBe('');
      });
    });

    describe('UI components and styling', () => {
      it('should use correct panel color for executing state', () => {
        const args = { appId: 'dashboard' };
        const { container } = render(
          <div>{registeredAction.render({ status: 'executing', args, result: null })}</div>
        );

        const panel = container.querySelector('[class*="euiPanel"]');
        expect(panel).toHaveClass('euiPanel--primary');
      });

      it('should use correct panel color for success state', () => {
        const args = { appId: 'dashboard' };
        const result = {
          success: true,
          navigated_to: 'dashboard',
          path: '',
          description: 'Success',
          timestamp: Date.now(),
        };

        const { container } = render(
          <div>{registeredAction.render({ status: 'complete', args, result })}</div>
        );

        const panel = container.querySelector('[class*="euiPanel"]');
        expect(panel).toHaveClass('euiPanel--success');
      });

      it('should use correct panel color for error states', () => {
        const args = { appId: 'dashboard' };
        const result = {
          success: false,
          error: 'Failed',
          attempted_app: 'dashboard',
          attempted_path: undefined,
          timestamp: Date.now(),
        };

        const { container } = render(
          <div>{registeredAction.render({ status: 'complete', args, result })}</div>
        );

        const panel = container.querySelector('[class*="euiPanel"]');
        expect(panel).toHaveClass('euiPanel--danger');
      });

      it('should include symlink icon for executing and success states', () => {
        const args = { appId: 'dashboard' };

        // Test executing state
        const { rerender } = render(
          <div>{registeredAction.render({ status: 'executing', args, result: null })}</div>
        );
        expect(document.querySelector('[data-euiicon-type="symlink"]')).toBeInTheDocument();

        // Test success state
        const result = {
          success: true,
          navigated_to: 'dashboard',
          path: '',
          description: 'Success',
          timestamp: Date.now(),
        };
        rerender(<div>{registeredAction.render({ status: 'complete', args, result })}</div>);
        expect(document.querySelector('[data-euiicon-type="symlink"]')).toBeInTheDocument();
      });

      it('should include alert icon for error states', () => {
        const args = { appId: 'dashboard' };
        const result = {
          success: false,
          error: 'Failed',
          attempted_app: 'dashboard',
          attempted_path: undefined,
          timestamp: Date.now(),
        };

        render(<div>{registeredAction.render({ status: 'complete', args, result })}</div>);

        expect(document.querySelector('[data-euiicon-type="alert"]')).toBeInTheDocument();
      });
    });

    describe('edge cases', () => {
      it('should handle undefined path correctly', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const result = await registeredAction.handler({
          appId: 'test-app',
          path: undefined,
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('test-app', undefined);
        expect(result.success).toBe(true);
      });

      it('should handle special characters in appId', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const result = await registeredAction.handler({
          appId: 'test-app-with-dashes',
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('test-app-with-dashes', undefined);
        expect(result.success).toBe(true);
      });

      it('should handle complex paths', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const complexPath = '#/saved-objects?type=dashboard&sortField=title&sortDir=asc';
        const result = await registeredAction.handler({
          appId: 'management',
          path: complexPath,
        });

        expect(mockNavigateToApp).toHaveBeenCalledWith('management', { path: complexPath });
        expect(result.success).toBe(true);
        expect(result.path).toBe(complexPath);
      });

      it('should handle very long descriptions', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const longDescription =
          'This is a very long description that might be used to describe a complex navigation scenario with many details and specific information about the destination page and its purpose';
        const result = await registeredAction.handler({
          appId: 'dashboard',
          description: longDescription,
        });

        expect(result.success).toBe(true);
        expect(result.description).toBe(longDescription);
      });

      it('should preserve timestamp precision', async () => {
        mockNavigateToApp.mockResolvedValueOnce(undefined);

        const beforeTime = Date.now();
        const result = await registeredAction.handler({
          appId: 'test-app',
        });
        const afterTime = Date.now();

        expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(result.timestamp).toBeLessThanOrEqual(afterTime);
      });

      it('should handle render with minimal args', () => {
        const args = { appId: 'minimal' };

        render(<div>{registeredAction.render({ status: 'executing', args, result: null })}</div>);

        expect(screen.getByText('Taking you to: minimal')).toBeInTheDocument();
      });

      it('should handle render with all optional properties', () => {
        const args = {
          appId: 'full',
          path: '/complete/path',
          description: 'Full Description',
        };

        render(<div>{registeredAction.render({ status: 'executing', args, result: null })}</div>);

        expect(
          screen.getByText('Taking you to: Full Description (/complete/path)')
        ).toBeInTheDocument();
      });
    });
  });
});
