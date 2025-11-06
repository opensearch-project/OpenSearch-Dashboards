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
import React, { useEffect, useState } from 'react';
import { TextColor } from '@elastic/eui/src/components/text/text_color';
import { useChatContext } from '../contexts/chat_context';
import { Message } from '../../common/types';
import { ChatContext } from '../services/suggested_action';
import { SuggestedActions } from '../services/suggested_action/types';

import './chat_suggestions.scss';

interface SuggestionBubbleProps {
  onClick: () => void;
  color: TextColor;
  content: string;
  iconType?: IconType;
  actionType?: string;
}

const SuggestionBubble: React.FC<SuggestionBubbleProps> = ({
  onClick,
  color,
  content,
  iconType = 'chatRight',
  actionType,
}: SuggestionBubbleProps) => {
  // Determine if this is a custom suggestion from a plugin
  const isCustomSuggestion = actionType === 'customize';

  // Use different icon for custom suggestions
  const suggestionIcon = isCustomSuggestion ? 'faceHappy' : iconType;

  // Build CSS classes for visual distinction
  const panelClasses = [
    'chat-suggestion-bubble-panel',
    isCustomSuggestion
      ? 'chat-suggestion-bubble-panel--custom'
      : 'chat-suggestion-bubble-panel--default',
  ].join(' ');

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
            color={isCustomSuggestion ? 'primary' : undefined}
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

export const ChatSuggestions = ({ messages }: { messages: Message[] }) => {
  const { suggestedActionsService, chatService } = useChatContext();

  const [customSuggestions, setCustomSuggestions] = useState<SuggestedActions[]>([]);
  const [isLoadingCustomSuggestions, setIsLoadingCustomSuggestions] = useState(false);

  // Load custom suggestions when component mounts or context changes
  useEffect(() => {
    const loadCustomSuggestions = async () => {
      try {
        setIsLoadingCustomSuggestions(true);

        // Create ChatContext object from current chat state
        const context: ChatContext = {
          conversationId: chatService.getThreadId(),
          currentMessage: messages[messages.length - 1],
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
  }, [suggestedActionsService, chatService, messages]);

  if (isLoadingCustomSuggestions || customSuggestions.length === 0) {
    return null;
  }
  return (
    <div aria-label="chat suggestions" style={{ marginLeft: '8px', marginBottom: '5px' }}>
      <EuiText color="subdued" size="xs" style={{ paddingLeft: 10 }}>
        <small>Available suggestions</small>
      </EuiText>
      <EuiFlexGroup alignItems="flexStart" direction="column" gutterSize="s">
        {customSuggestions.map((suggestedAction, i) => (
          <div key={i}>
            <EuiSpacer size="xs" />
            <EuiFlexItem grow={false}>
              <SuggestionBubble
                onClick={suggestedAction.action}
                color="default"
                content={suggestedAction.message}
                actionType={suggestedAction.actionType}
              />
            </EuiFlexItem>
          </div>
        ))}
      </EuiFlexGroup>
    </div>
  );
};
