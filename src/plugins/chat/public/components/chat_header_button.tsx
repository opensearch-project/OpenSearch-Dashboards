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

interface ChatHeaderButtonProps {
  core: CoreStart;
  chatService: ChatService;
}

export const ChatHeaderButton: React.FC<ChatHeaderButtonProps> = ({ core, chatService }) => {
  const [isOpen, setIsOpen] = useState(false);
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

    sideCarRef.current = core.overlays.sidecar.open(mountPoint, {
      className: 'chat-sidecar',
      config: {
        dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
        paddingSize: 400,
        isHidden: false,
      },
    });

    setIsOpen(true);
  }, [core.overlays]);

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
        <div style={{ height: '100vh', boxSizing: 'border-box' }}>
          <ChatProvider chatService={chatService}>
            <ChatWindow />
          </ChatProvider>
        </div>
      </div>
    </>
  );
};
