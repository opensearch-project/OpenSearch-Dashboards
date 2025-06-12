/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { TabComponentProps } from '../../../services/tab_registry/tab_registry_service';

/**
 * Simple placeholder visualization component
 * This is a simplified version that just shows a message
 * In a real implementation, this would render actual visualizations
 */
export const VisualizationsTab: React.FC<TabComponentProps> = ({ query, results, error }) => {
  // Check if we have aggregation results
  const hasAggregations = results?.aggregations && Object.keys(results.aggregations).length > 0;

  if (error) {
    return (
      <EuiPanel color="danger" hasBorder>
        <EuiTitle size="s">
          <h3>Error</h3>
        </EuiTitle>
        <EuiText>
          <p>{error.message}</p>
        </EuiText>
      </EuiPanel>
    );
  }

  if (!results || !hasAggregations) {
    return (
      <EuiEmptyPrompt
        iconType="visualizeApp"
        title={<h2>No visualization data</h2>}
        body={
          <p>
            Try running a query with aggregations to see visualizations.
            <br />
            Example: <code>source=my_index | stats count() by category</code>
          </p>
        }
      />
    );
  }

  // In a real implementation, we would render actual visualizations based on the results
  // For now, we'll just show a placeholder message
  return (
    <div>
      <EuiPanel hasBorder paddingSize="l">
        <EuiTitle>
          <h2>Visualization Placeholder</h2>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiText>
          <p>
            This is a placeholder for visualizations. In a real implementation, this would render
            charts and graphs based on the query results.
          </p>
          <p>
            <strong>Query:</strong>{' '}
            {typeof query.query === 'string' ? query.query : JSON.stringify(query.query)}
          </p>
          <p>
            <strong>Language:</strong> {query.language}
          </p>
        </EuiText>

        <EuiSpacer size="l" />

        <EuiTitle size="s">
          <h3>Aggregation Data</h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText>
          <pre>{JSON.stringify(results.aggregations, null, 2)}</pre>
        </EuiText>
      </EuiPanel>
    </div>
  );
};

// For React.lazy compatibility
// eslint-disable-next-line import/no-default-export
export { VisualizationsTab as default };
