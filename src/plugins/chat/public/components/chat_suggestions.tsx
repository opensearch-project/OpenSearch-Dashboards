/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiText,
  IconType,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { TextColor } from '@elastic/eui/src/components/text/text_color';
import { useChatContext } from '../contexts/chat_context';
import { Message } from '../../common/types';
import { ChatContext } from '../services/suggested_action';
import { SuggestedActions } from '../services/suggested_action/types';
import { parseInlineSuggestions } from '../../common/parse_inline_suggestions';

import './chat_suggestions.scss';

interface SuggestionBubbleProps {
  onClick: () => void;
  color: TextColor;
  content: string;
  iconType?: IconType;
  actionType?: string;
  selected?: boolean;
}

const SuggestionBubble: React.FC<SuggestionBubbleProps> = ({
  onClick,
  color,
  content,
  iconType = 'returnKey',
  actionType,
  selected = false,
}: SuggestionBubbleProps) => {
  // Determine if this is a custom suggestion from a plugin
  const isCustomSuggestion = actionType === 'customize';

  const suggestionIcon = selected ? 'check' : isCustomSuggestion ? 'faceHappy' : iconType;

  // Build CSS classes for visual distinction
  const panelClasses = [
    'chat-suggestion-bubble-panel',
    isCustomSuggestion
      ? 'chat-suggestion-bubble-panel--custom'
      : 'chat-suggestion-bubble-panel--default',
    selected ? 'chat-suggestion-bubble-panel--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <EuiPanel
      hasShadow={false}
      hasBorder={false}
      element="div"
      className={panelClasses}
      onClick={onClick}
      grow={false}
      paddingSize="none"
      data-test-subj={isCustomSuggestion ? 'custom-suggestion-bubble' : 'default-suggestion-bubble'}
    >
      <EuiFlexGroup gutterSize="none" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon
            type={suggestionIcon}
            style={{ marginRight: 5 }}
            color={selected ? 'success' : isCustomSuggestion ? 'primary' : undefined}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="xs" color={color}>
            {content}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

export const ChatSuggestions = ({
  messages,
  currentMessage,
  onAppendInput,
  onRemoveInput,
  inputValue,
}: {
  messages: Message[];
  currentMessage: Message;
  onAppendInput?: (content: string) => void;
  onRemoveInput?: (content: string) => void;
  inputValue?: string;
}) => {
  const { suggestedActionsService, chatService } = useChatContext();

  const [customSuggestions, setCustomSuggestions] = useState<SuggestedActions[]>([]);
  const [isLoadingCustomSuggestions, setIsLoadingCustomSuggestions] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Parse inline suggestions from the current assistant message content
  const inlineSuggestionActions: SuggestedActions[] = useMemo(() => {
    if (currentMessage.role !== 'assistant' || typeof currentMessage.content !== 'string') {
      return [];
    }
    const { suggestions } = parseInlineSuggestions(currentMessage.content);
    return suggestions.map((text) => ({
      actionType: 'send_as_input',
      message: text,
      action: async () => true,
    }));
  }, [currentMessage]);

  // Load custom suggestions when component mounts or context changes
  useEffect(() => {
    const loadCustomSuggestions = async () => {
      try {
        setIsLoadingCustomSuggestions(true);

        // Create ChatContext object from current chat state
        const context: ChatContext = {
          conversationId: chatService.getThreadId(),
          currentMessage,
          messageHistory: messages,
        };

        const customSuggestionResults = await suggestedActionsService.getCustomSuggestions(context);
        setCustomSuggestions(customSuggestionResults);
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.error('Error loading custom suggestions:', error);
        setCustomSuggestions([]);
      } finally {
        setIsLoadingCustomSuggestions(false);
      }
    };

    loadCustomSuggestions();
  }, [suggestedActionsService, chatService, messages, currentMessage]);

  const hasUserTypedInput =
    !!(inputValue && inputValue.trim().length > 0) && selectedIndices.size === 0;
  const visibleInlineSuggestions = hasUserTypedInput ? [] : inlineSuggestionActions;
  const allSuggestions = [...visibleInlineSuggestions, ...customSuggestions];

  if (isLoadingCustomSuggestions || allSuggestions.length === 0) {
    return null;
  }

  const handleSuggestionClick = (index: number, suggestedAction: SuggestedActions) => {
    const isInline = suggestedAction.actionType === 'send_as_input';

    if (isInline) {
      if (selectedIndices.has(index)) {
        setSelectedIndices(new Set());
        onRemoveInput?.(suggestedAction.message);
      } else {
        // Deselect previous selection
        selectedIndices.forEach((prevIndex) => {
          const prevAction = allSuggestions[prevIndex];
          if (prevAction) onRemoveInput?.(prevAction.message);
        });
        setSelectedIndices(new Set([index]));
        onAppendInput?.(suggestedAction.message);
      }
    } else {
      suggestedAction.action();
    }
  };

  return (
    <div
      aria-label="chat suggestions"
      style={{ paddingLeft: 8, paddingBottom: 5, overflow: 'hidden' }}
    >
      <EuiText color="subdued" size="xs" style={{ paddingLeft: 10 }}>
        <small>Follow up</small>
      </EuiText>
      <EuiFlexGroup alignItems="flexStart" direction="column" gutterSize="s">
        {allSuggestions.map((suggestedAction, i) => (
          <div key={i}>
            <EuiSpacer size="xs" />
            <EuiFlexItem grow={false}>
              <SuggestionBubble
                onClick={() => handleSuggestionClick(i, suggestedAction)}
                color={selectedIndices.has(i) ? 'success' : 'default'}
                content={suggestedAction.message}
                actionType={suggestedAction.actionType}
                selected={selectedIndices.has(i)}
              />
            </EuiFlexItem>
          </div>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
