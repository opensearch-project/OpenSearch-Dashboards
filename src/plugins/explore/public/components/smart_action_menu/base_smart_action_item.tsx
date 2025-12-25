/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiCodeBlock,
  EuiPanel,
  EuiTextArea,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import {
  SmartActionContext,
  SmartActionDefinition,
  SmartActionResult,
} from '../../types/smart_actions';
import { SmartActionConfig } from '../../types/base_actions';
import { usePageContext } from '../../hooks/use_page_context';
import { getServices } from '../../services/services';

export interface BaseSmartActionItemProps {
  /** The smart action context containing field selection data */
  context: SmartActionContext;
  /** The action definition */
  action: SmartActionDefinition;
  /** Action-specific configuration including knowledge context */
  config: SmartActionConfig;
  /** Function to close the action panel */
  onClose: () => void;
  /** Optional callback for handling action results */
  onResult?: (result: SmartActionResult) => void;
}

/**
 * Base component for smart actions that provides 3-layer context handling:
 * 1. Page Context - current page state (query, filters, time range)
 * 2. Selected Context - selected text and field information
 * 3. Knowledge Context - action-specific context and instructions
 *
 * Also provides shared Apply/Preview functionality for all smart actions.
 */
export const BaseSmartActionItem: React.FC<BaseSmartActionItemProps> = ({
  context,
  action,
  config,
  onClose,
  onResult,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<string | null>(null);
  const [editablePrompt, setEditablePrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Layer 1: Page Context - current query, filters, time range, index pattern
  const pageContext = usePageContext();

  // Layer 2: Selected Context - field selection data (shared across all smart actions)
  const selectedContext = useMemo(
    () => ({
      selectedText: context.fieldContext.selectedText,
      fieldName: context.fieldContext.fieldName,
      fieldType: context.fieldContext.fieldType,
      fieldValue: context.fieldContext.fieldValue,
      documentId: context.fieldContext.documentId,
      rowIndex: context.fieldContext.rowIndex,
    }),
    [context.fieldContext]
  );

  // Layer 3: Knowledge Context - action-specific context from config
  const knowledgeContext = useMemo(() => config.knowledgeContext, [config.knowledgeContext]);

  // Combined context for AI agent
  const fullContext = useMemo(
    () => ({
      pageContext,
      selectedContext,
      knowledgeContext,
      actionDescription: config.description,
    }),
    [pageContext, selectedContext, knowledgeContext, config.description]
  );

  // Generate clean prompt for Preview/Apply
  const generatePrompt = useCallback(() => {
    return `Create a PPL parse command to extract the pattern "${selectedContext.selectedText}" from the field "${selectedContext.fieldName}".

Field Information:
- Field Name: ${selectedContext.fieldName}
- Field Type: ${selectedContext.fieldType}
- Selected Pattern: "${selectedContext.selectedText}"

Please generate a PPL parse command using Java regex with named capture groups. The command should be ready for execution in OpenSearch.`;
  }, [selectedContext]);

  const handlePreview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPreviewResult(null);

    try {
      // Generate clean prompt for preview
      const cleanPrompt = generatePrompt();
      setEditablePrompt(cleanPrompt);
      setPreviewResult('preview-editable'); // Marker to show editable preview
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onResult?.({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [generatePrompt, onResult]);

  const handleApply = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the prompt (use edited version if available, otherwise generate fresh)
      const promptToSend = editablePrompt || generatePrompt();

      // Get chat service
      const services = getServices();
      const chatService = services.core?.chat;

      if (!chatService) {
        throw new Error('Chat service not available');
      }

      if (!chatService.isAvailable()) {
        throw new Error('Chat service not ready');
      }

      // Use sendMessage for silent execution (no window opening)
      const { observable, userMessage } = await chatService.sendMessage(promptToSend, []);

      if (!observable) {
        throw new Error('No observable returned from chat service');
      }

      // Subscribe to observable to trigger the network request and get response
      let aiResponse = '';
      let hasCompleted = false;

      const subscription = observable.subscribe({
        next: (chunk: any) => {
          // Only log key events we care about for debugging
          if (chunk?.type === 'TOOL_CALL_START') {
            console.log('🔧 TOOL_CALL_START received:', chunk);
          } else if (chunk?.type === 'TOOL_CALL_ARGS') {
            console.log('🔧 TOOL_CALL_ARGS received:', chunk);
            try {
              const toolArgs = JSON.parse(chunk.delta);
              console.log('📝 GENERATED PPL QUERY:', toolArgs.query);
            } catch (e) {
              console.log('🔍 Raw tool args delta:', chunk.delta);
            }
          } else if (chunk?.type === 'TOOL_CALL_END') {
            console.log('🔧 TOOL_CALL_END received:', chunk);
          } else if (chunk?.type === 'TOOL_CALL_RESULT') {
            console.log('🔧 TOOL_CALL_RESULT received:', chunk);
          }

          // Accumulate response chunks
          if (chunk && typeof chunk === 'string') {
            aiResponse += chunk;
          } else if (chunk && chunk.content) {
            aiResponse += chunk.content;
          }
        },
        complete: () => {
          console.log('✅ AI response completed');
          hasCompleted = true;
        },
        error: (error: any) => {
          console.error('❌ AI response error:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
          setIsLoading(false);
        },
      });

      // Clean up subscription to prevent memory leaks
      setTimeout(() => {
        if (subscription) {
          subscription.unsubscribe();
        }
      }, 30000); // Clean up after 30 seconds max

      // For now, we'll show success immediately since this is async
      // In the future, we could wait for completion or show the response in a toast
      services.notifications?.toasts.addSuccess({
        title: 'PPL Parse Command Requested',
        text: 'AI is generating a PPL parse command for the selected pattern silently.',
        toastLifeTimeMs: 8000,
      });

      onResult?.({
        success: true,
        data: fullContext,
      });

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onResult?.({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [editablePrompt, generatePrompt, fullContext, onResult, onClose]);

  return (
    <EuiPanel paddingSize="m">
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem>
          <EuiText size="s">
            <h4>{action.displayName}</h4>
            <p>{config.description}</p>
          </EuiText>
        </EuiFlexItem>

        {/* Selected Context Display */}
        <EuiFlexItem>
          <EuiText size="xs" color="subdued">
            <strong>Selected:</strong> "{selectedContext.selectedText}" from field "
            {selectedContext.fieldName}" ({selectedContext.fieldType})
          </EuiText>
        </EuiFlexItem>

        {/* Preview Result Display */}
        {previewResult === 'preview-editable' && (
          <EuiFlexItem>
            <EuiText size="xs">
              <strong>Preview & Edit Prompt:</strong>
            </EuiText>
            <EuiSpacer size="xs" />
            <EuiTextArea
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
              rows={8}
              resize="vertical"
              placeholder="Generated prompt will appear here..."
            />
          </EuiFlexItem>
        )}

        {/* Error Display */}
        {error && (
          <EuiFlexItem>
            <EuiText color="danger" size="xs">
              <strong>Error:</strong> {error}
            </EuiText>
          </EuiFlexItem>
        )}

        <EuiSpacer size="m" />

        {/* Action Buttons */}
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="s" justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="s" onClick={onClose} disabled={isLoading}>
                {i18n.translate('explore.smartActions.base.cancelButton', {
                  defaultMessage: 'Cancel',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                onClick={handlePreview}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {i18n.translate('explore.smartActions.base.previewButton', {
                  defaultMessage: 'Preview',
                })}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                fill
                onClick={handleApply}
                isLoading={isLoading}
                disabled={isLoading}
              >
                {i18n.translate('explore.smartActions.base.applyButton', {
                  defaultMessage: 'Apply',
                })}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
