/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiButtonEmpty,
  EuiLoadingContent,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import {
  ConversationHistoryService,
  SavedConversation,
} from '../services/conversation_history_service';
import './recent_sessions.scss';

interface RecentSessionsProps {
  conversationHistoryService: ConversationHistoryService;
  onSelectConversation: (conversation: SavedConversation) => void;
  onViewAll: () => void;
}

export const RecentSessions: React.FC<RecentSessionsProps> = ({
  conversationHistoryService,
  onSelectConversation,
  onViewAll,
}) => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecentConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await conversationHistoryService.getConversations({
        page: 0,
        pageSize: 3,
      });
      setConversations(result.conversations);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load recent conversations:', err);
      setError(
        err instanceof Error
          ? err.message
          : i18n.translate('chat.recentSessions.loadErrorMessage', {
              defaultMessage: 'Failed to load recent conversations',
            })
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistoryService]);

  useEffect(() => {
    loadRecentConversations();
  }, [loadRecentConversations]);

  if (isLoading) {
    return (
      <div className="recentSessions">
        <EuiFlexGroup direction="column" gutterSize="s">
          <EuiFlexItem>
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>
                    {i18n.translate('chat.recentSessions.title', {
                      defaultMessage: 'RECENT',
                    })}
                  </strong>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiLoadingContent lines={3} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  if (error || conversations.length === 0) {
    return null;
  }

  return (
    <div className="recentSessions">
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <strong>
                  {i18n.translate('chat.recentSessions.title', {
                    defaultMessage: 'RECENT',
                  })}
                </strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="xs" onClick={onViewAll} flush="right">
                {i18n.translate('chat.recentSessions.viewAll', {
                  defaultMessage: 'View all',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="s">
            {conversations.map((conversation) => (
              <EuiFlexItem key={conversation.id}>
                <EuiPanel
                  paddingSize="m"
                  hasBorder
                  className="recentSessions__item"
                  onClick={() => onSelectConversation(conversation)}
                >
                  <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
                    <EuiFlexItem className="recentSessions__itemTitle">
                      <EuiText size="s" className="eui-textTruncate">
                        <span>{conversation.name}</span>
                      </EuiText>
                    </EuiFlexItem>
                    {moment(conversation.updatedAt).isValid() && (
                      <EuiFlexItem grow={false}>
                        <EuiText size="xs" color="subdued">
                          {moment(conversation.updatedAt).fromNow()}
                        </EuiText>
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                </EuiPanel>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};
