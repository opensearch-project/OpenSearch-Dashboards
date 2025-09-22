/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext, useEffect } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageHeader,
  EuiTitle,
  EuiButton,
  EuiSpacer,
} from '@elastic/eui';
import { AssistantActionProvider, AssistantActionContext } from '../../../context_provider/public';
import { usePPLQueryAction } from '../actions/ppl_query_action';
import { ToolCallRenderer } from './tool_call_renderer';

/**
 * Demo component that shows how the PPL query action works
 */
function PPLQueryDemoContent() {
  const context = useContext(AssistantActionContext);

  // Register the PPL query action
  usePPLQueryAction();

  // Simulate a tool call from the assistant
  const simulatePPLQuery = () => {
    if (!context) return;

    const { updateToolCallState } = context;
    const toolCallId = `tool-${Date.now()}`;

    // Simulate the tool call lifecycle
    // 1. Start
    updateToolCallState(toolCallId, {
      id: toolCallId,
      name: 'render_ppl_query',
      status: 'pending',
      timestamp: Date.now(),
    });

    // 2. Set args (after a short delay to simulate streaming)
    setTimeout(() => {
      updateToolCallState(toolCallId, {
        status: 'executing',
        args: {
          query: `source = opensearch_dashboards_sample_data_logs
| where response >= 400
| stats count() by geo.dest
| sort - count()
| head 10`,
          description: 'Top 10 destinations with the most errors (4xx and 5xx responses)',
        },
      });
    }, 500);

    // 3. Complete (after another delay)
    setTimeout(() => {
      updateToolCallState(toolCallId, {
        status: 'complete',
        result: { query: 'copied', copied: false },
      });
    }, 1500);
  };

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>PPL Query Action Demo</h1>
          </EuiTitle>
        </EuiPageHeader>
        <EuiPageContent>
          <p>
            This demo shows how the PPL query action works. Click the button below to simulate the
            assistant generating a PPL query.
          </p>

          <EuiSpacer />

          <EuiButton onClick={simulatePPLQuery} fill>
            Simulate PPL Query Generation
          </EuiButton>

          <EuiSpacer size="l" />

          {/* Render all active tool calls */}
          {context &&
            Array.from(context.toolCallStates.keys()).map((toolCallId) => (
              <div key={toolCallId}>
                <ToolCallRenderer toolCallId={toolCallId} />
                <EuiSpacer />
              </div>
            ))}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
}

/**
 * Main demo component with provider
 */
export function PPLQueryDemo() {
  return (
    <AssistantActionProvider
      onToolsUpdated={(tools) => {
        // eslint-disable-next-line no-console
        console.log('Available tools:', tools);
      }}
    >
      <PPLQueryDemoContent />
    </AssistantActionProvider>
  );
}
