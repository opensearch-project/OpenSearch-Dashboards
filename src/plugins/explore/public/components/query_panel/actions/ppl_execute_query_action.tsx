/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiSpacer, EuiCode, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useDispatch } from 'react-redux';
import { useAssistantAction } from '../../../../../context_provider/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { loadQueryActionCreator } from '../../../application/utils/state_management/actions/query_editor/load_query';
import { useSetEditorTextWithQuery } from '../../../application/hooks';

interface PPLExecuteQueryArgs {
  query: string;
  autoExecute?: boolean;
  description?: string;
}

export function usePPLExecuteQueryAction(
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>
) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();

  useAssistantAction<PPLExecuteQueryArgs>({
    name: 'execute_ppl_query',
    description: 'Update the query bar with a PPL query and optionally execute it',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The PPL query to set in the query bar',
        },
        autoExecute: {
          type: 'boolean',
          description: 'Whether to automatically execute the query (default: true)',
        },
        description: {
          type: 'string',
          description: 'Optional description of what the query does',
        },
      },
      required: ['query'],
    },
    handler: async (args) => {
      try {
        // Check if we should auto-execute
        const shouldExecute = args.autoExecute !== false; // Default to true

        if (shouldExecute) {
          // Use loadQueryActionCreator which updates the editor and executes the query
          // This follows the same pattern as Recent Queries
          dispatch(loadQueryActionCreator(services, setEditorTextWithQuery, args.query));

          return {
            success: true,
            executed: true,
            query: args.query,
            message: 'Query updated and executed',
          };
        } else {
          // Just update the editor without executing
          setEditorTextWithQuery(args.query);

          return {
            success: true,
            executed: false,
            query: args.query,
            message: 'Query updated',
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          query: args.query,
        };
      }
    },
    render: ({ status, args, result }) => {
      if (!args) return null;

      const getStatusColor = () => {
        if (status === 'failed' || (result && !result.success)) return 'danger';
        if (status === 'complete' && result?.executed) return 'success';
        if (status === 'complete') return 'primary';
        return 'subdued';
      };

      const getStatusIcon = () => {
        if (status === 'failed' || (result && !result.success)) return '✗';
        if (status === 'executing') return '⟳';
        return '✓';
      };

      return (
        <EuiPanel paddingSize="s" color={getStatusColor()}>
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <strong>{getStatusIcon()}</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                {status === 'executing' && 'Updating query...'}
                {status === 'complete' && result?.message}
                {status === 'failed' && (result?.error || 'Failed to update query')}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          {args.description && (
            <>
              <EuiSpacer size="xs" />
              <EuiText size="xs" color="subdued">
                {args.description}
              </EuiText>
            </>
          )}
          <EuiSpacer size="xs" />
          <EuiText size="xs">
            <EuiCode transparentBackground>{args.query}</EuiCode>
          </EuiText>
        </EuiPanel>
      );
    },
  });
}
