/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';

import { combineLatest, Subscription } from 'rxjs';

import { distinctUntilChanged, map } from 'rxjs/operators';

import { CoreStart, MountPoint, SIDECAR_DOCKED_MODE } from '../../../../core/public';
import { ContextProviderStart } from '../../../context_provider/public';

import { ChatService } from '../services/chat_service';
import { SuggestedActionsService } from '../services/suggested_action';
import { StarterSuggestionsPluginStart } from '../../../starter_suggestions/public';
import { ConfirmationService } from '../services/confirmation_service';
import { HumanInputService } from '../services/human_input_service';
import { ChatMount } from '../components/chat_mount';

/**
 * Chromeless apps where the chat sidecar should still be allowed to open.
 * Normally the chat hides on chromeless pages, but these specific apps
 * render their own UI that includes chat entry points (e.g. "Ask AI" card).
 *
 * Intentionally plain strings rather than imports: the chat plugin must not
 * depend on the plugins that own these apps. Keep in sync with
 * WORKSPACE_INITIAL_APP_ID in src/plugins/workspace/common/constants.ts —
 * nothing enforces that at compile time, so renaming the app id there fails
 * silently here.
 */
const CHROMELESS_CHAT_ALLOWED_APPS = new Set(['workspace_initial']);

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
  private chatAllowedSubscription?: Subscription;
  private isChatAllowed: boolean = false;
  private pendingOpenSidecarFrame?: number;

  start(options: {
    core: CoreStart;
    chatService: ChatService;
    contextProvider?: ContextProviderStart;
    charts?: any;
    suggestedActionsService: SuggestedActionsService;
    confirmationService: ConfirmationService;
    humanInputService: HumanInputService;
    starterSuggestionsService: StarterSuggestionsPluginStart;
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

      // Chat is allowed when chrome is visible, or when the current app is a
      // chromeless page that explicitly supports chat (allow-list).
      if (!this.isChatAllowed) {
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

    // Chat is allowed when chrome is visible OR the current app is an
    // allow-listed chromeless page. This single signal drives the openSidecar
    // guard, hide/show on navigation, and re-opening a restored window state
    // (e.g. isWindowOpen persisted in localStorage) once a page that supports
    // chat becomes active.
    this.chatAllowedSubscription = combineLatest([
      core.chrome.getIsVisible$(),
      core.application.currentAppId$,
    ])
      .pipe(
        map(
          ([isVisible, appId]) => isVisible || (!!appId && CHROMELESS_CHAT_ALLOWED_APPS.has(appId))
        ),
        distinctUntilChanged()
      )
      .subscribe((isAllowed) => {
        // Update state immediately so the openSidecar guard works correctly
        this.isChatAllowed = isAllowed;

        // Clear any pending openSidecar call
        if (this.pendingOpenSidecarFrame) {
          cancelAnimationFrame(this.pendingOpenSidecarFrame);
          this.pendingOpenSidecarFrame = undefined;
        }

        if (isAllowed) {
          if (this.sideCar) {
            // Chat became allowed and sidecar exists, show it immediately
            core.overlays.sidecar.show();
          } else if (core.chat.isWindowOpen()) {
            // Chat became allowed, sidecar not initialized, but window state is open
            // Defer openSidecar to next frame to avoid flicker during fast navigation
            this.pendingOpenSidecarFrame = requestAnimationFrame(() => {
              this.pendingOpenSidecarFrame = undefined;
              openSidecar();
            });
          }
        } else if (this.sideCar) {
          // Chat is not allowed on this page, hide the sidecar immediately
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
    this.chatAllowedSubscription?.unsubscribe();
  }
}
