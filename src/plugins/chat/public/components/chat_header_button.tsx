/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { CoreStart, MountPoint, SIDECAR_DOCKED_MODE } from '../../../../core/public';
import { ChatWindow } from './chat_window';
import { ChatProvider } from '../contexts/chat_context';
import { ChatService } from '../services/chat_service';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ContextProviderStart } from '../../../context_provider/public';

export enum ChatLayoutMode {
  SIDECAR = 'sidecar',
  FULLSCREEN = 'fullscreen',
}

interface ChatHeaderButtonProps {
  core: CoreStart;
  chatService: ChatService;
  contextProvider?: ContextProviderStart;
}

export const ChatHeaderButton: React.FC<ChatHeaderButtonProps> = ({
  core,
  chatService,
  contextProvider,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<ChatLayoutMode>(ChatLayoutMode.SIDECAR);
  const sideCarRef = useRef<{ close: () => void }>();
  const mountPointRef = useRef<HTMLDivElement>(null);

  const openSidecar = useCallback(() => {
    if (!mountPointRef.current) return;

    const mountPoint: MountPoint = (element) => {
      if (mountPointRef.current) {
        element.appendChild(mountPointRef.current);
      }
      return () => {
        if (mountPointRef.current && element.contains(mountPointRef.current)) {
          element.removeChild(mountPointRef.current);
        }
      };
    };

    const sidecarConfig =
      layoutMode === ChatLayoutMode.FULLSCREEN
        ? {
            dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
            paddingSize: window.innerHeight,
            isHidden: false,
          }
        : {
            dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
            paddingSize: 400,
            isHidden: false,
          };

    sideCarRef.current = core.overlays.sidecar.open(mountPoint, {
      className: `chat-sidecar chat-sidecar--${layoutMode}`,
      config: sidecarConfig,
    });

    setIsOpen(true);
  }, [core.overlays, layoutMode]);

  const closeSidecar = useCallback(() => {
    if (sideCarRef.current) {
      sideCarRef.current.close();
      sideCarRef.current = undefined;
    }
    setIsOpen(false);
  }, []);

  const toggleSidecar = useCallback(() => {
    if (isOpen) {
      closeSidecar();
    } else {
      openSidecar();
    }
  }, [isOpen, openSidecar, closeSidecar]);

  const toggleLayoutMode = useCallback(() => {
    const newLayoutMode =
      layoutMode === ChatLayoutMode.SIDECAR ? ChatLayoutMode.FULLSCREEN : ChatLayoutMode.SIDECAR;

    setLayoutMode(newLayoutMode);

    // Update sidecar config dynamically if currently open
    if (isOpen && sideCarRef.current) {
      const newSidecarConfig =
        newLayoutMode === ChatLayoutMode.FULLSCREEN
          ? {
              dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
              paddingSize: window.innerHeight - 50,
              isHidden: false,
            }
          : {
              dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
              paddingSize: 400,
              isHidden: false,
            };

      core.overlays.sidecar.setSidecarConfig(newSidecarConfig);
    }
  }, [layoutMode, isOpen, core.overlays.sidecar]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sideCarRef.current) {
        sideCarRef.current.close();
      }
    };
  }, []);

  return (
    <>
      <EuiToolTip content="Open Chat Assistant">
        <EuiButtonIcon
          iconType="generate"
          onClick={toggleSidecar}
          color={isOpen ? 'primary' : 'text'}
          size="s"
          aria-label="Toggle chat assistant"
          display="base"
        />
      </EuiToolTip>

      {/* Mount point for sidecar content */}
      <div
        ref={mountPointRef}
        style={{
          width: '100%',
          height: '100%',
          display: isOpen ? 'block' : 'none',
        }}
      >
        <div style={{ height: '100%', boxSizing: 'border-box' }}>
          <OpenSearchDashboardsContextProvider services={{ core, contextProvider }}>
            <ChatProvider chatService={chatService}>
              <ChatWindow layoutMode={layoutMode} onToggleLayout={toggleLayoutMode} />
            </ChatProvider>
          </OpenSearchDashboardsContextProvider>
        </div>
      </div>
    </>
  );
};
