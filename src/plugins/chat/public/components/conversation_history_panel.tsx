/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  EuiText,
  EuiSpacer,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopover,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiLoadingSpinner,
  EuiButton,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../core/public';
import {
  ConversationHistoryService,
  SavedConversation,
} from '../services/conversation_history_service';
import './conversation_history_panel.scss';
import { AgenticMemoryProvider } from '../services/agentic_memory_provider';

interface ConversationGroup {
  title: string;
  conversations: SavedConversation[];
}

interface ConversationHistoryPanelProps {
  conversationHistoryService: ConversationHistoryService;
  onSelectConversation: (conversation: SavedConversation) => void;
}

export const ConversationHistoryPanel: React.FC<ConversationHistoryPanelProps> = ({
  conversationHistoryService,
  onSelectConversation,
}) => {
  const { services } = useOpenSearchDashboards<{ core: CoreStart }>();
  const toasts = services.core?.notifications?.toasts;

  const [groups, setGroups] = useState<ConversationGroup[]>([]);
  const [popoverOpenForId, setPopoverOpenForId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const PAGE_SIZE = 20;
  const hideDeleteAction =
    conversationHistoryService.getMemoryProvider() instanceof AgenticMemoryProvider;

  /**
   * Group conversations by date
   */
  const groupConversations = useCallback(
    (conversations: SavedConversation[]): ConversationGroup[] => {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const recent: SavedConversation[] = [];
      const older: SavedConversation[] = [];

      conversations.forEach((conv) => {
        if (conv.updatedAt >= sevenDaysAgo) {
          recent.push(conv);
        } else {
          older.push(conv);
        }
      });

      const result: ConversationGroup[] = [];

      if (recent.length > 0) {
        result.push({
          title: i18n.translate('chat.conversationHistory.last7DaysLabel', {
            defaultMessage: 'Last 7 days',
          }),
          conversations: recent,
        });
      }

      if (older.length > 0) {
        result.push({
          title: i18n.translate('chat.conversationHistory.olderLabel', {
            defaultMessage: 'Older',
          }),
          conversations: older,
        });
      }

      return result;
    },
    []
  );

  const loadGroups = useCallback(
    async (currentPage: number, append: boolean = false) => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);
      try {
        const result = await conversationHistoryService.getConversations({
          page: currentPage,
          pageSize: PAGE_SIZE,
        });

        if (append) {
          // Append new conversations and regroup
          setGroups((prevGroups) => {
            // Extract all existing conversations
            const allConversations: SavedConversation[] = [];
            prevGroups.forEach((group) => {
              allConversations.push(...group.conversations);
            });
            // Add new conversations
            allConversations.push(...result.conversations);
            // Regroup all conversations
            return groupConversations(allConversations);
          });
        } else {
          setGroups(groupConversations(result.conversations));
        }

        setHasMore(result.hasMore);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load conversations:', err);
        setError(
          err instanceof Error
            ? err.message
            : i18n.translate('chat.conversationHistory.loadErrorMessage', {
                defaultMessage: 'Failed to load conversations',
              })
        );
      } finally {
        setIsLoading(false);
      }
    },
    [conversationHistoryService, isLoading, groupConversations]
  );

  useEffect(() => {
    loadGroups(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationHistoryService]);

  const handleDelete = async (threadId: string) => {
    try {
      await conversationHistoryService.deleteConversation(threadId);
      pageRef.current = 0;
      setPage(0);
      await loadGroups(0, false);
      setPopoverOpenForId(null);
    } catch (err) {
      toasts?.addDanger({
        title: i18n.translate('chat.conversationHistory.deleteErrorTitle', {
          defaultMessage: 'Failed to delete conversation',
        }),
        text:
          err instanceof Error
            ? err.message
            : i18n.translate('chat.conversationHistory.deleteErrorMessage', {
                defaultMessage: 'An unexpected error occurred while deleting the conversation.',
              }),
      });
      setPopoverOpenForId(null);
    }
  };

  const handleRetry = useCallback(() => {
    pageRef.current = 0;
    setPage(0);
    loadGroups(0, false);
  }, [loadGroups]);

  const handleRetryPagination = useCallback(() => {
    loadGroups(pageRef.current, true);
  }, [loadGroups]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current || !hasMore || isLoading || error) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    // Load more when scrolled within 100px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      pageRef.current += 1;
      const nextPage = pageRef.current;
      setPage((prev) => prev + 1);
      loadGroups(nextPage, true);
    }
  }, [hasMore, isLoading, loadGroups, error]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSelectConversation = (conversation: SavedConversation) => {
    onSelectConversation(conversation);
  };

  const togglePopover = (id: string) => {
    setPopoverOpenForId(popoverOpenForId === id ? null : id);
  };

  const closePopover = () => {
    setPopoverOpenForId(null);
  };

  return (
    <div className="conversationHistoryPanel__content" ref={contentRef}>
      {error && groups.length === 0 ? (
        <EuiEmptyPrompt
          iconType="alert"
          color="danger"
          title={
            <h3>
              {i18n.translate('chat.conversationHistory.errorTitle', {
                defaultMessage: 'Unable to load conversations',
              })}
            </h3>
          }
          body={
            <EuiText color="subdued" size="s">
              {error}
            </EuiText>
          }
          actions={
            <EuiButton color="primary" fill onClick={handleRetry}>
              {i18n.translate('chat.conversationHistory.retryButton', {
                defaultMessage: 'Try again',
              })}
            </EuiButton>
          }
        />
      ) : groups.length === 0 && isLoading ? (
        <div className="conversationHistoryPanel__loading conversationHistoryPanel__loading--initial">
          <EuiLoadingSpinner size="l" />
          <EuiText color="subdued" size="s">
            {i18n.translate('chat.conversationHistory.loadingMessage', {
              defaultMessage: 'Loading conversations...',
            })}
          </EuiText>
        </div>
      ) : groups.length === 0 ? (
        <div className="conversationHistoryPanel__empty">
          <EuiText color="subdued" size="s">
            {i18n.translate('chat.conversationHistory.emptyStateMessage', {
              defaultMessage: 'No conversation history',
            })}
          </EuiText>
        </div>
      ) : (
        <>
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="conversationHistoryPanel__group">
              <EuiText size="xs" className="conversationHistoryPanel__groupTitle">
                <h3>{group.title}</h3>
              </EuiText>
              <EuiSpacer size="s" />
              <EuiListGroup className="conversationHistoryPanel__list">
                {group.conversations.map((conversation) => {
                  if (hideDeleteAction) {
                    return (
                      <EuiListGroupItem
                        label={conversation.name}
                        onClick={() => handleSelectConversation(conversation)}
                        size="s"
                      />
                    );
                  }
                  return (
                    <EuiPopover
                      key={conversation.id}
                      anchorClassName="conversationHistoryPanel__itemAnchor"
                      button={
                        <div>
                          <EuiListGroupItem
                            label={conversation.name}
                            onClick={() => handleSelectConversation(conversation)}
                            size="s"
                            extraAction={{
                              iconType: 'boxesHorizontal',
                              'aria-label': i18n.translate(
                                'chat.conversationHistory.actionsAriaLabel',
                                {
                                  defaultMessage: 'Actions',
                                }
                              ),
                              onClick: (e) => {
                                e.stopPropagation();
                                togglePopover(conversation.id);
                              },
                              alwaysShow: false,
                            }}
                          />
                        </div>
                      }
                      isOpen={popoverOpenForId === conversation.id}
                      closePopover={closePopover}
                      panelPaddingSize="none"
                      anchorPosition="downLeft"
                    >
                      <EuiContextMenuPanel
                        size="s"
                        items={[
                          <EuiContextMenuItem
                            key="delete"
                            icon="trash"
                            onClick={() => handleDelete(conversation.threadId)}
                          >
                            {i18n.translate('chat.conversationHistory.deleteButton', {
                              defaultMessage: 'Delete',
                            })}
                          </EuiContextMenuItem>,
                        ]}
                      />
                    </EuiPopover>
                  );
                })}
              </EuiListGroup>
            </div>
          ))}

          {error && groups.length > 0 && (
            <div className="conversationHistoryPanel__error">
              <EuiText color="danger" size="s">
                {i18n.translate('chat.conversationHistory.paginationErrorMessage', {
                  defaultMessage: 'Failed to load more conversations',
                })}
              </EuiText>
              <EuiButton size="s" onClick={handleRetryPagination}>
                {i18n.translate('chat.conversationHistory.retryButton', {
                  defaultMessage: 'Try again',
                })}
              </EuiButton>
            </div>
          )}

          {isLoading && !error && (
            <div className="conversationHistoryPanel__loading">
              <EuiLoadingSpinner size="m" />
            </div>
          )}
        </>
      )}
    </div>
  );
};
