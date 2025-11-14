/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useAssistantAction } from '../../../context_provider/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';

interface NavigateArgs {
  appId: string;
  path?: string;
  description?: string;
}

export function useNavigateAction() {
  const { services } = useOpenSearchDashboards<{
    core: CoreStart;
  }>();

  useAssistantAction<NavigateArgs>({
    name: 'navigate_to_page',
    description:
      'Navigate the user to a different page within OpenSearch Dashboards. Use this when you need to take the user to a specific dashboard, discover page, or other application.',
    parameters: {
      type: 'object',
      properties: {
        appId: {
          type: 'string',
          description:
            'The OpenSearch Dashboards application to navigate to (e.g., "management", "visualize", "discover", "dashboard", "explore")',
        },
        path: {
          type: 'string',
          description:
            'Optional path within the application (e.g., "#/saved-objects", "/create", "?query=example")',
        },
        description: {
          type: 'string',
          description:
            'Optional user-friendly description of the destination (e.g., "Visualization Builder", "Index Management")',
        },
      },
      required: ['appId'],
    },
    handler: async (args) => {
      const { appId, path, description } = args;

      try {
        if (!appId || typeof appId !== 'string') {
          throw new Error('appId is required and must be a string');
        }

        const navigationOptions = path ? { path } : undefined;
        await services.core.application.navigateToApp(appId, navigationOptions);

        return {
          success: true,
          navigated_to: appId,
          path: path || '',
          description: description || `Navigated to ${appId}${path ? ` (${path})` : ''}`,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          attempted_app: appId,
          attempted_path: path,
          timestamp: Date.now(),
        };
      }
    },
    render: ({ status, args, result, error }) => {
      if (status === 'executing' && args) {
        return (
          <EuiPanel paddingSize="m" color="primary">
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiIcon type="symlink" size="m" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s">
                  <p>
                    <strong>Navigating...</strong>
                  </p>
                  <p>
                    Taking you to: {args.description || args.appId}
                    {args.path ? ` (${args.path})` : ''}
                  </p>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        );
      }

      if (status === 'complete' && result) {
        if (result.success) {
          return (
            <EuiPanel paddingSize="s" color="success" style={{ opacity: 0.8 }}>
              <EuiFlexGroup alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiIcon type="symlink" size="m" />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="s">
                    <p>✓ Redirecting...</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          );
        } else {
          return (
            <EuiPanel paddingSize="s" color="danger">
              <EuiFlexGroup alignItems="center" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiIcon type="alert" size="m" />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size="s">
                    <p>✗ Navigation failed: {result.error}</p>
                    <p>Attempted URL: {result.attempted_url}</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          );
        }
      }

      if (status === 'failed' && error) {
        return (
          <EuiPanel paddingSize="s" color="danger">
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiIcon type="alert" size="m" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s">
                  <p>✗ Navigate tool error: {error.message}</p>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        );
      }

      return null;
    },
  });
}
