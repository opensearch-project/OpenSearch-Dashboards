/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationRequest {
  id: string;
  toolName: string;
  toolCallId: string;
  args: any;
  description?: string;
  timestamp: number;
}

export interface ConfirmationResponse {
  id: string;
  approved: boolean;
  modifiedArgs?: any;
  cancelled?: boolean;
}

/**
 * Service to manage user confirmations for tool calls
 */
export class ConfirmationService {
  private pendingConfirmations$ = new BehaviorSubject<ConfirmationRequest[]>([]);
  private responseCallbacks = new Map<string, (response: ConfirmationResponse) => void>();

  /**
   * Get observable of pending confirmations
   */
  getPendingConfirmations$(): Observable<ConfirmationRequest[]> {
    return this.pendingConfirmations$.asObservable();
  }

  /**
   * Request user confirmation for a tool call
   * Returns a promise that resolves when user approves/rejects
   */
  async requestConfirmation(
    toolName: string,
    toolCallId: string,
    args: any,
    description?: string
  ): Promise<ConfirmationResponse> {
    const id = `${toolCallId}-${Date.now()}`;
    const request: ConfirmationRequest = {
      id,
      toolName,
      toolCallId,
      args,
      description,
      timestamp: Date.now(),
    };

    // Add to pending confirmations
    const current = this.pendingConfirmations$.getValue();
    this.pendingConfirmations$.next([...current, request]);

    // Return a promise that resolves when user responds
    return new Promise<ConfirmationResponse>((resolve) => {
      this.responseCallbacks.set(id, resolve);
    });
  }

  /**
   * User approves the confirmation
   */
  approve(id: string, modifiedArgs?: any): void {
    const callback = this.responseCallbacks.get(id);
    if (callback) {
      callback({
        id,
        approved: true,
        modifiedArgs,
      });
      this.cleanup(id);
    }
  }

  /**
   * User rejects the confirmation
   */
  reject(id: string): void {
    const callback = this.responseCallbacks.get(id);
    if (callback) {
      callback({
        id,
        approved: false,
      });
      this.cleanup(id);
    }
  }

  /**
   * Clean up after confirmation is handled
   */
  private cleanup(id: string): void {
    this.responseCallbacks.delete(id);
    const current = this.pendingConfirmations$.getValue();
    this.pendingConfirmations$.next(current.filter((req) => req.id !== id));
  }

  /**
   * Get current pending confirmations
   */
  getPendingConfirmations(): ConfirmationRequest[] {
    return this.pendingConfirmations$.getValue();
  }

  /**
   * Check if there are any pending confirmations
   */
  hasPendingConfirmations(): boolean {
    return this.pendingConfirmations$.getValue().length > 0;
  }

  /**
   * stop all confirmations (e.g. on unmount)
   */
  cleanAll(): void {
    // Resolve all pending promises with cancellation flag to prevent memory leaks
    // This signals that the confirmation was cancelled due to cleanup, not user rejection
    this.pendingConfirmations$.getValue().forEach((request) => {
      const callback = this.responseCallbacks.get(request.id);
      if (callback) {
        callback({
          id: request.id,
          approved: false,
          cancelled: true,
        });
      }
    });
    this.pendingConfirmations$.next([]);
    this.responseCallbacks.clear();
  }
}
