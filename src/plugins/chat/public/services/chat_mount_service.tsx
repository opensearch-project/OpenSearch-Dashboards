/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import React from 'react';
import { Subscription } from 'rxjs';
import { CoreStart, MountPoint, SIDECAR_DOCKED_MODE } from '../../../../core/public';

import { ChatService } from '../services/chat_service';
import { ContextProviderStart } from '../../../context_provider/public';
import { SuggestedActionsService } from '../services/suggested_action';
import { ConfirmationService } from '../services/confirmation_service';
import { ChatMount } from '../components/chat_mount';

export interface ChatMountStartContract {
  open: () => void;
  close: () => void;
  toggleOpen: () => void;
}

export class ChatMountService {
  private sideCar: { close: () => void } | undefined;
  private chatMountPoint: MountPoint | undefined;
  private unsubscribeWindowOpen?: () => void;
  private unsubscribeWindowClose?: () => void;
  private chromeVisibilitySubscription?: Subscription;
  private isChromeVisible: boolean = true;

  start(options: {
    core: CoreStart;
    chatService: ChatService;
    contextProvider?: ContextProviderStart;
    charts?: any;
    suggestedActionsService: SuggestedActionsService;
    confirmationService: ConfirmationService;
  }): ChatMountStartContract {
    const { core, chatService } = options;

    // Create mount point once and reuse
    this.chatMountPoint = (element) => {
      let root: ReturnType<typeof createRoot> | null = createRoot(element);
      root.render(<ChatMount {...options} />);
      return () => {
        root?.unmount();
        root = null;
      };
    };

    const openSidecar = () => {
      if (this.sideCar) {
        return; // Already open
      }

      this.sideCar = core.overlays.sidecar.open(this.chatMountPoint!, {
        className: 'chat-sidecar chat-sidecar--sidecar',
        config: {
          dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
          paddingSize: chatService.getPaddingSize(),
          isHidden: !this.isChromeVisible, // Hide immediately if chrome is not visible
        },
      });
    };

    const closeSidecar = () => {
      if (!this.sideCar) {
        return; // Already closed
      }

      this.sideCar.close();
      this.sideCar = undefined;
    };

    const toggleOpen = () => {
      if (this.sideCar) {
        closeSidecar();
      } else {
        openSidecar();
      }
    };

    // Register event handlers
    this.unsubscribeWindowOpen = core.chat.onWindowOpen(() => {
      openSidecar();
    });

    this.unsubscribeWindowClose = core.chat.onWindowClose(() => {
      closeSidecar();
    });

    // Subscribe to chrome visibility changes to control sidecar visibility
    // without affecting the isWindowOpen state
    this.chromeVisibilitySubscription = core.chrome.getIsVisible$().subscribe((isVisible) => {
      // Track chrome visibility state
      this.isChromeVisible = isVisible;

      // Only control visibility if sidecar is open
      if (this.sideCar) {
        if (isVisible) {
          // Chrome is visible, show the sidecar
          core.overlays.sidecar.show();
        } else {
          // Chrome is not visible, hide the sidecar temporarily
          core.overlays.sidecar.hide();
        }
      }
    });

    return {
      open: openSidecar,
      close: closeSidecar,
      toggleOpen,
    };
  }

  stop() {
    if (this.sideCar) {
      this.sideCar.close();
      this.sideCar = undefined;
    }
    this.unsubscribeWindowOpen?.();
    this.unsubscribeWindowClose?.();
    this.chromeVisibilitySubscription?.unsubscribe();
  }
}
