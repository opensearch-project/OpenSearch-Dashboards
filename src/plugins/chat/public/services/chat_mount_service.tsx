/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';

import { Subscription } from 'rxjs';

import { distinctUntilChanged } from 'rxjs/operators';

import { CoreStart, MountPoint, SIDECAR_DOCKED_MODE } from '../../../../core/public';
import { ContextProviderStart } from '../../../context_provider/public';

import { ChatService } from '../services/chat_service';
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
  private isChromeVisible: boolean = false;
  private pendingOpenSidecarFrame?: number;

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

      // Don't open sidecar if chrome is not visible
      if (!this.isChromeVisible) {
        return;
      }

      this.sideCar = core.overlays.sidecar.open(this.chatMountPoint!, {
        className: 'chat-sidecar chat-sidecar--sidecar',
        config: {
          dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
          paddingSize: chatService.getPaddingSize(),
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
    this.chromeVisibilitySubscription = core.chrome
      .getIsVisible$()
      .pipe(distinctUntilChanged())
      .subscribe((isVisible) => {
        // Update visibility state immediately so openSidecar guard works correctly
        this.isChromeVisible = isVisible;

        // Clear any pending openSidecar call
        if (this.pendingOpenSidecarFrame) {
          cancelAnimationFrame(this.pendingOpenSidecarFrame);
          this.pendingOpenSidecarFrame = undefined;
        }

        if (isVisible) {
          if (this.sideCar) {
            // Chrome is visible and sidecar exists, show it immediately
            core.overlays.sidecar.show();
          } else if (core.chat.isWindowOpen()) {
            // Chrome became visible, sidecar not initialized, but window state is open
            // Defer openSidecar to next frame to avoid flicker during fast navigation
            this.pendingOpenSidecarFrame = requestAnimationFrame(() => {
              this.pendingOpenSidecarFrame = undefined;
              openSidecar();
            });
          }
        } else if (this.sideCar) {
          // Chrome is not visible, hide the sidecar immediately
          core.overlays.sidecar.hide();
        }
      });

    return {
      open: openSidecar,
      close: closeSidecar,
      toggleOpen,
    };
  }

  stop() {
    if (this.pendingOpenSidecarFrame) {
      cancelAnimationFrame(this.pendingOpenSidecarFrame);
      this.pendingOpenSidecarFrame = undefined;
    }
    if (this.sideCar) {
      this.sideCar.close();
      this.sideCar = undefined;
    }
    this.unsubscribeWindowOpen?.();
    this.unsubscribeWindowClose?.();
    this.chromeVisibilitySubscription?.unsubscribe();
  }
}
