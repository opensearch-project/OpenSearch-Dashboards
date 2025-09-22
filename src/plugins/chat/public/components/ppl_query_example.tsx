/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { EuiPage, EuiPageBody, EuiPageContent, EuiPageHeader, EuiTitle } from '@elastic/eui';
import { usePPLQueryAction } from '../actions/ppl_query_action';
import { AssistantActionProvider } from '../../../context_provider/public';
import { ToolCallRenderer } from './tool_call_renderer';

/**
 * Example component demonstrating how to use the PPL query action
 */
export function PPLQueryExample() {
  // Register the PPL query action
  usePPLQueryAction();

  // Simulate a tool call from the assistant
  useEffect(() => {
    // In a real scenario, this would be triggered by the assistant
    // For demo purposes, we'll manually trigger it
    const simulateToolCall = () => {
      // This would normally come from the assistant's tool call events
      const mockToolCallId = 'tool-call-123';

      // The context would handle this in the real implementation
    };

    // Uncomment to test
    // simulateToolCall();
  }, []);

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>PPL Query Action Example</h1>
          </EuiTitle>
        </EuiPageHeader>
        <EuiPageContent>
          <p>
            This component demonstrates the PPL query action. When the assistant generates a PPL
            query, it will be rendered here.
          </p>

          {/* This would render the tool call UI when triggered */}
          <ToolCallRenderer toolCallId="tool-call-123" />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
}

/**
 * Example of how to wrap your app with the AssistantActionProvider
 */
export function AppWithActions() {
  return (
    <AssistantActionProvider
      onToolsUpdated={(tools) => {
        // eslint-disable-next-line no-console
        console.log('Available tools:', tools);
      }}
    >
      <PPLQueryExample />
    </AssistantActionProvider>
  );
}
