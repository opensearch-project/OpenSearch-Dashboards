/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  EuiText,
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

  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [popoverOpenForId, setPopoverOpenForId] = useState<string | null>(null);
  const [_page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const PAGE_SIZE = 20;
  const isLoadingRef = useRef(false);

  const hideDeleteAction = useMemo(
    () => conversationHistoryService.getMemoryProvider() instanceof AgenticMemoryProvider,
    [conversationHistoryService]
  );

  const setIsLoadingWithRef = useCallback((value: boolean) => {
    isLoadingRef.current = value;
    setIsLoading(value);
  }, []);

  const loadConversations = useCallback(
    async (currentPage: number, append: boolean = false) => {
      if (isLoadingRef.current) return;

      setIsLoadingWithRef(true);
      setError(null);
      try {
        const result = await conversationHistoryService.getConversations({
          page: currentPage,
          pageSize: PAGE_SIZE,
        });

        if (append) {
          // Append new conversations
          setConversations((prevConversations) => {
            const existingIds = new Set(prevConversations.map((c) => c.id));
            return [
              ...prevConversations,
              ...result.conversations.filter((conversation) => !existingIds.has(conversation.id)),
            ];
          });
        } else {
          setConversations(result.conversations);
        }

        setHasMore(result.hasMore);
        pageRef.current = currentPage;

        // Auto-load more if content doesn't fill the container (no scrollbar)
        if (result.hasMore) {
          // Use requestAnimationFrame to check after DOM updates
          requestAnimationFrame(() => {
            const container = contentRef.current;
            if (container && container.scrollHeight <= container.clientHeight) {
              setIsLoadingWithRef(false);
              loadConversations(currentPage + 1, true);
            }
          });
        }
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
        setIsLoadingWithRef(false);
      }
    },
    [conversationHistoryService, setIsLoadingWithRef]
  );

  useEffect(() => {
    loadConversations(0, false);
  }, [loadConversations]);

  const handleDelete = async (threadId: string) => {
    try {
      await conversationHistoryService.deleteConversation(threadId);
      pageRef.current = 0;
      setPage(0);
      setIsLoadingWithRef(false);
      await loadConversations(0, false);
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
    loadConversations(0, false);
  }, [loadConversations]);

  const handleRetryPagination = useCallback(() => {
    loadConversations(pageRef.current, true);
  }, [loadConversations]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current || !hasMore || isLoadingRef.current || error) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    // Load more when scrolled within 100px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      pageRef.current += 1;
      const nextPage = pageRef.current;
      setPage((prev) => prev + 1);
      loadConversations(nextPage, true);
    }
  }, [hasMore, loadConversations, error]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);

    // Watch for container resize (e.g., window height change)
    const resizeObserver = new ResizeObserver(() => {
      if (!hasMore || isLoadingRef.current || error) return;
      if (container.scrollHeight <= container.clientHeight) {
        pageRef.current += 1;
        const nextPage = pageRef.current;
        setPage((prev) => prev + 1);
        loadConversations(nextPage, true);
      }
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll, hasMore, error, loadConversations]);

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
      {error && conversations.length === 0 ? (
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
      ) : conversations.length === 0 && isLoading ? (
        <div className="conversationHistoryPanel__loading conversationHistoryPanel__loading--initial">
          <EuiLoadingSpinner size="l" />
          <EuiText color="subdued" size="s">
            {i18n.translate('chat.conversationHistory.loadingMessage', {
              defaultMessage: 'Loading conversations...',
            })}
          </EuiText>
        </div>
      ) : conversations.length === 0 ? (
        <div className="conversationHistoryPanel__empty">
          <EuiText color="subdued" size="s">
            {i18n.translate('chat.conversationHistory.emptyStateMessage', {
              defaultMessage: 'No conversation history',
            })}
          </EuiText>
        </div>
      ) : (
        <>
          <EuiListGroup className="conversationHistoryPanel__list" maxWidth={false}>
            {conversations.map((conversation) => {
              if (hideDeleteAction) {
                return (
                  <EuiListGroupItem
                    key={conversation.id}
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
                          // eslint-disable-next-line @typescript-eslint/naming-convention
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

          {error && conversations.length > 0 && (
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
