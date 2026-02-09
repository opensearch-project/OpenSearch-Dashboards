/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  EuiFieldText,
  EuiButton,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { LogActionItemProps } from '../../types/log_actions';
import { ChatServiceStart } from '../../../../../core/public';

// Create stable NOOP hook reference outside component to avoid re-renders
const NOOP_DYNAMIC_CONTEXT_HOOK = (_options: any, _shouldCleanup?: boolean): string => '';

interface AskAIActionItemProps extends LogActionItemProps {
  chatService: ChatServiceStart;
}

export const AskAIActionItem: React.FC<AskAIActionItemProps> = ({
  context,
  onClose,
  onResult,
  chatService,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Cleanup function to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create context data for dynamic context registration (like table_row.tsx)
  const contextData = useMemo(() => {
    // Generate proper row label using table index (same as table_row.tsx)
    const rowIndex = context.metadata?.index;
    const documentId = context.document._id || `log-${Date.now()}`;
    const rowLabel = rowIndex !== undefined ? `Row ${rowIndex + 1}` : 'Selected Row';

    const data = {
      id: `ask-ai-action-${documentId}`,
      description: `Selected log entry from Explore data table for AI analysis`,
      value: context.document,
      label: rowLabel,
      categories: ['explore', 'chat', 'dynamic'],
    };

    return data;
  }, [context.document, context.metadata]);

  // Register dynamic context using proper hook (like table_row.tsx pattern)
  const useDynamicContext =
    services.contextProvider?.hooks?.useDynamicContext || NOOP_DYNAMIC_CONTEXT_HOOK;

  // Register context with cleanup on unmount (true = cleanup when component unmounts)
  useDynamicContext(contextData, false);

  const handleExecute = useCallback(async () => {
    if (!userInput.trim()) {
      onResult?.({ success: false, error: 'Please provide a question about the log entry.' });
      return;
    }

    if (!isMountedRef.current) return;

    setIsLoading(true);

    try {
      // Always use sendMessageWithWindow since it works in both open and closed states
      // It will handle opening the window if needed, and properly delegate when window is open
      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const result = await chatService.sendMessageWithWindow(userInput.trim(), []);

      onResult?.({
        success: true,
        data: { message: 'Question sent to AI assistant with log context' },
      });

      // Close the action panel
      onClose();
    } catch (error) {
      onResult?.({
        success: false,
        error: `Failed to send message to AI: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userInput, chatService, onResult, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleExecute();
      }
    },
    [handleExecute]
  );

  return (
    <div style={{ padding: '16px', minWidth: '300px' }}>
      <EuiText size="s" color="subdued">
        Ask AI about this log entry. The log data will be automatically included as context.
      </EuiText>

      <EuiSpacer size="m" />

      <EuiFieldText
        placeholder="Ask a question about this log entry..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        fullWidth
        data-test-subj="askAiActionInput"
      />

      <EuiSpacer size="m" />

      <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton size="s" onClick={onClose} disabled={isLoading}>
            Cancel
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            fill
            onClick={handleExecute}
            isLoading={isLoading}
            disabled={isLoading || !userInput.trim()}
            data-test-subj="askAiActionExecuteButton"
          >
            {isLoading ? 'Sending...' : 'Send to AI'}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
