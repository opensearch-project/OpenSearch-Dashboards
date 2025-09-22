/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiCodeBlock,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
} from '@elastic/eui';
import { useAssistantAction } from '../../../context_provider/public';

interface PPLQueryArgs {
  query: string;
  description?: string;
}

export function usePPLQueryAction() {
  useAssistantAction<PPLQueryArgs>({
    name: 'render_ppl_query',
    description: 'Render a PPL query in a formatted card with copy functionality',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The PPL query to display',
        },
        description: {
          type: 'string',
          description: 'Optional description of what the query does',
        },
      },
      required: ['query'],
    },
    handler: async ({ query }) => {
      // This handler just returns the query for confirmation
      // The actual rendering happens in the render function
      return { query, copied: false };
    },
    render: ({ status, args, result }) => {
      if (!args?.query) return null;

      const handleCopy = () => {
        navigator.clipboard.writeText(args.query);
        // You could add a toast notification here
      };

      return (
        <EuiCard
          title="PPL Query"
          description={args.description || 'Generated PPL query for your request'}
          paddingSize="m"
        >
          <EuiSpacer size="s" />
          <EuiCodeBlock language="sql" fontSize="m" paddingSize="m" isCopyable overflowHeight={300}>
            {args.query}
          </EuiCodeBlock>
          <EuiSpacer size="m" />
          <EuiFlexGroup justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButton size="s" onClick={handleCopy} iconType="copy">
                Copy Query
              </EuiButton>
            </EuiFlexItem>
            {status === 'complete' && result?.copied && (
              <EuiFlexItem grow={false}>
                <EuiButton size="s" color="success" iconType="check" disabled>
                  Copied!
                </EuiButton>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiCard>
      );
    },
  });
}
