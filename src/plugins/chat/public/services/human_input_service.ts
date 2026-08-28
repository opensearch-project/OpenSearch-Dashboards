/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';

/**
 * The kind of answer the assistant is asking the user for.
 * - `select`  — pick one of `options`.
 * - `confirm` — a yes/no decision (rendered as two buttons).
 * - `text`    — free-form text input.
 */
export type AskUserInputType = 'select' | 'confirm' | 'text';

export interface AskUserOption {
  /** Human-readable label shown on the choice control. */
  label: string;
  /** Value sent back to the assistant when this option is chosen. */
  value: string;
}

export interface AskUserRequest {
  /** Unique id for this pending request (toolCallId + timestamp). */
  id: string;
  /** The tool call that triggered the question, used to correlate the answer. */
  toolCallId: string;
  /** The question to show the user. */
  prompt: string;
  /** How the user should answer. Defaults to `text` when omitted. */
  inputType: AskUserInputType;
  /** Choices for `select` input types. */
  options?: AskUserOption[];
  /**
   * For `select`: also offer a free-text field so the user can answer with
   * something not in `options` (a "None of these / other" escape). Ignored for
   * `confirm` and `text`.
   */
  allowFreeText?: boolean;
  timestamp: number;
}

export interface AskUserResponse {
  id: string;
  /** The value the user provided / chose. Empty when cancelled or declined. */
  answer: string;
  /**
   * True when the request was resolved by cleanup (e.g. unmount / new
   * conversation) rather than a real user action. Callers should treat this
   * like a cancellation, not an answer, and NOT send a tool result.
   */
  cancelled?: boolean;
  /**
   * True when the user explicitly chose to dismiss the question without
   * answering. Unlike `cancelled`, this is a deliberate user action and
   * SHOULD be reported back to the assistant so it can proceed without the
   * answer.
   */
  declined?: boolean;
}

/**
 * Service that lets an assistant tool ask the user a structured question and
 * block until they answer.
 *
 * This is the mechanism behind the `ask_user` frontend tool: the tool's
 * handler calls {@link ask}, which returns a promise that stays pending until
 * the user responds via the UI (which calls {@link answer}). Because the tool
 * handler is awaited inside the normal frontend-tool execution path, the run
 * naturally pauses at the tool-use boundary and resumes — via a continuation
 * run carrying the tool result — once the promise resolves. No protocol
 * changes are needed.
 *
 * Modeled on {@link ConfirmationService}, which uses the same
 * pending-promise pattern for tool confirmations.
 */
export class HumanInputService {
  private pending$ = new BehaviorSubject<AskUserRequest[]>([]);
  private responseCallbacks = new Map<string, (response: AskUserResponse) => void>();
  // Answers recorded synchronously at click time (toolCallId → answer), so the
  // UI can show "Your answer: X" immediately instead of waiting for the
  // continuation run's tool result. Keyed by toolCallId — what the renderer has.
  private answers$ = new BehaviorSubject<Map<string, string>>(new Map());

  /** Observable of pending questions for the UI to render. */
  getPending$(): Observable<AskUserRequest[]> {
    return this.pending$.asObservable();
  }

  /** Current snapshot of pending questions. */
  getPending(): AskUserRequest[] {
    return this.pending$.getValue();
  }

  /** Observable of locally-recorded answers (toolCallId → answer). */
  getAnswers$(): Observable<Map<string, string>> {
    return this.answers$.asObservable();
  }

  /** Current snapshot of locally-recorded answers (toolCallId → answer). */
  getAnswers(): Map<string, string> {
    return this.answers$.getValue();
  }

  /**
   * Ask the user a question and return a promise that resolves when they
   * answer. The promise resolves with `{ cancelled: true }` if the request is
   * torn down by {@link cleanAll} before the user responds.
   */
  ask(request: {
    toolCallId: string;
    prompt: string;
    inputType?: AskUserInputType;
    options?: AskUserOption[];
    allowFreeText?: boolean;
  }): Promise<AskUserResponse> {
    const id = `${request.toolCallId}-${Date.now()}`;
    const entry: AskUserRequest = {
      id,
      toolCallId: request.toolCallId,
      prompt: request.prompt,
      inputType: request.inputType ?? 'text',
      options: request.options,
      allowFreeText: request.allowFreeText,
      timestamp: Date.now(),
    };

    this.pending$.next([...this.pending$.getValue(), entry]);

    return new Promise<AskUserResponse>((resolve) => {
      this.responseCallbacks.set(id, resolve);
    });
  }

  /**
   * Deliver the user's answer for a pending question, resolving the promise
   * returned by {@link ask} and removing the request from the pending list.
   */
  answer(id: string, value: string): void {
    const callback = this.responseCallbacks.get(id);
    if (callback) {
      // Record the answer against its toolCallId before resolving, so the UI can
      // show it immediately (the continuation run's tool result arrives later).
      const request = this.pending$.getValue().find((req) => req.id === id);
      if (request) {
        const next = new Map(this.answers$.getValue());
        next.set(request.toolCallId, value);
        this.answers$.next(next);
      }
      callback({ id, answer: value });
      this.cleanup(id);
    }
  }

  /**
   * Record that the user explicitly declined to answer a pending question.
   * Resolves the promise with `declined: true` so the assistant is told the
   * user chose not to answer (distinct from {@link cleanAll}'s teardown
   * cancellation, which suppresses any tool result).
   */
  decline(id: string): void {
    const callback = this.responseCallbacks.get(id);
    if (callback) {
      callback({ id, answer: '', declined: true });
      this.cleanup(id);
    }
  }

  /**
   * Resolve all pending questions as cancelled (e.g. on unmount or when
   * switching conversations) so the awaiting tool handlers unblock instead of
   * leaking promises.
   */
  cleanAll(): void {
    this.pending$.getValue().forEach((request) => {
      const callback = this.responseCallbacks.get(request.id);
      if (callback) {
        callback({ id: request.id, answer: '', cancelled: true });
      }
    });
    this.pending$.next([]);
    this.responseCallbacks.clear();
    // Drop recorded answers — a reloaded conversation restores them from results.
    if (this.answers$.getValue().size > 0) {
      this.answers$.next(new Map());
    }
  }

  private cleanup(id: string): void {
    this.responseCallbacks.delete(id);
    this.pending$.next(this.pending$.getValue().filter((req) => req.id !== id));
  }
}
