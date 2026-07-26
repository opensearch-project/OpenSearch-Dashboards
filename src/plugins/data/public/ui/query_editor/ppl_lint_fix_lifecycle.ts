/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { withTimeout } from '@osd/std';
import type { AssistantContextStore } from '../../../../context_provider/public';
import { cleanupPPLLintFixRequest } from '../../chat_tools/ppl_lint_fix_session';
import { PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX } from '../../chat_tools/ppl_lint_fix_tool_registration';
import type {
  AskPPLLintFixRequest,
  RemovePPLLintFixContextById,
} from '../../chat_tools/ppl_lint_fix_session';

export const PPL_LINT_FIX_CHAT_TIMEOUT_MS = 4000;
export const PPL_LINT_FIX_CHAT_TIMEOUT_ERROR = 'Timed out opening AI for this PPL lint fix.';
export const PPL_LINT_FIX_REQUEST_TTL_MS = 10 * 60 * 1000;

export interface PPLLintFixLaunchFailure {
  error: unknown;
  abandonedOwnedRequest: boolean;
}

let pplLintFixLaunchQueue: Promise<void> = Promise.resolve();
let activePPLLintFixLifecycle: PPLLintFixLifecycle | undefined;

export function addPPLLintFixAssistantContext(
  request: AskPPLLintFixRequest,
  contextStore?: Pick<AssistantContextStore, 'addContext'>
): void {
  if (!request.chatContext || !contextStore) {
    return;
  }

  contextStore.addContext({
    id: PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId,
    description: 'OpenSearch PPL lint quick-fix request details',
    value: request.chatContext,
    label: 'PPL lint fix request',
    // clearConversation removes non-page contexts before sending the message.
    // Explicit request cleanup still removes this entry on every exit path.
    categories: ['page', 'chat', 'ppl-lint-fix'],
  });
}

/**
 * Tracks the request owned by one query-editor mount and releases only that
 * request when asynchronous launch work completes out of order.
 */
export class PPLLintFixLifecycle {
  private ownedRequestId?: string;
  private expiryTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly removeContextById?: RemovePPLLintFixContextById,
    private readonly timeoutMs = PPL_LINT_FIX_CHAT_TIMEOUT_MS,
    private readonly requestTtlMs = PPL_LINT_FIX_REQUEST_TTL_MS
  ) {}

  public beginRequest(requestId: string): void {
    if (
      activePPLLintFixLifecycle &&
      activePPLLintFixLifecycle !== this &&
      activePPLLintFixLifecycle.ownedRequestId
    ) {
      activePPLLintFixLifecycle.abandonRequest(activePPLLintFixLifecycle.ownedRequestId);
    }
    if (this.ownedRequestId) {
      this.abandonRequest(this.ownedRequestId);
    }
    this.ownedRequestId = requestId;
    activePPLLintFixLifecycle = this;
  }

  public ownsRequest(requestId: string): boolean {
    return this.ownedRequestId === requestId;
  }

  public abandonRequest(requestId: string): boolean {
    const abandonedOwnedRequest = this.ownsRequest(requestId);
    cleanupPPLLintFixRequest(
      requestId,
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX,
      this.removeContextById
    );
    if (abandonedOwnedRequest) {
      this.clearExpiryTimer();
      this.ownedRequestId = undefined;
      if (activePPLLintFixLifecycle === this) {
        activePPLLintFixLifecycle = undefined;
      }
    }
    return abandonedOwnedRequest;
  }

  public async waitForChatLaunch(
    requestId: string,
    launch: () => Promise<unknown>
  ): Promise<PPLLintFixLaunchFailure | undefined> {
    const queuedLaunch = pplLintFixLaunchQueue.then(async () => {
      if (this.ownsRequest(requestId)) {
        await launch();
      }
    });
    // Keep later launches behind the real launch promise. A timeout may abandon
    // a request, but its still-running setup must settle before a replacement
    // can reset the same chat window.
    pplLintFixLaunchQueue = queuedLaunch.then(
      () => undefined,
      () => undefined
    );

    try {
      await withTimeout({
        promise: queuedLaunch,
        timeout: this.timeoutMs,
        errorMessage: PPL_LINT_FIX_CHAT_TIMEOUT_ERROR,
      });
      if (this.ownsRequest(requestId)) {
        this.clearExpiryTimer();
        this.expiryTimer = setTimeout(() => {
          this.abandonRequest(requestId);
        }, this.requestTtlMs);
      }
      return undefined;
    } catch (error) {
      return {
        error,
        abandonedOwnedRequest: this.abandonRequest(requestId),
      };
    }
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer !== undefined) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = undefined;
    }
  }

  public dispose(): void {
    if (this.ownedRequestId) {
      this.abandonRequest(this.ownedRequestId);
    } else {
      this.clearExpiryTimer();
    }
  }
}
