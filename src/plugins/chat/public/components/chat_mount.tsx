/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback } from 'react';
import { CoreStart } from '../../../../core/public';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { TextSelectionMonitor } from '../../../context_provider/public';

import { ChatService } from '../services/chat_service';
import { ChatWindow } from '../components/chat_window';
import { ChatProvider } from '../contexts/chat_context';
import { ChatLayoutMode } from '../types';
import { ContextProviderStart } from '../../../context_provider/public';
import { SuggestedActionsService } from '../services/suggested_action';
import { ConfirmationService } from '../services/confirmation_service';
import { GlobalAssistantProvider } from '../../../context_provider/public';

import './chat_mount.scss';

interface ChatMountProps {
  core: CoreStart;
  chatService: ChatService;
  contextProvider?: ContextProviderStart;
  charts?: any;
  suggestedActionsService: SuggestedActionsService;
  confirmationService: ConfirmationService;
}

export const ChatMount = ({
  core,
  chatService,
  contextProvider,
  charts,
  suggestedActionsService,
  confirmationService,
}: ChatMountProps) => {
  const services = useMemo(
    () => ({
      core,
      contextProvider,
      charts,
    }),
    [core, contextProvider, charts]
  );

  const handleClose = useCallback(() => {
    core.chat.closeWindow();
  }, [core.chat]);

  const handleToolsUpdated = useCallback(() => {
    // Tools updated in chat
  }, []);

  return (
    <>
      {/* Text selection monitor - always active when chat UI is rendered */}
      <TextSelectionMonitor />
      <div className="chatMount__mountPoint">
        <div className="chatMount__content">
          <OpenSearchDashboardsContextProvider services={services}>
            <GlobalAssistantProvider onToolsUpdated={handleToolsUpdated}>
              <ChatProvider
                chatService={chatService}
                suggestedActionsService={suggestedActionsService}
                confirmationService={confirmationService}
              >
                <ChatWindow layoutMode={ChatLayoutMode.SIDECAR} onClose={handleClose} />
              </ChatProvider>
            </GlobalAssistantProvider>
          </OpenSearchDashboardsContextProvider>
        </div>
      </div>
    </>
  );
};
