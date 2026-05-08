/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLValidationResult, PPLToken } from './ppl_language_analyzer';
import { getWorker } from '../monaco_environment';
import { WorkerLabels } from '../worker_config';

/**
 * Simple worker proxy that communicates with PPL worker
 */
export class PPLWorkerProxyService {
  private worker: Worker | undefined;
  private messageId = 0;
  private pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

  /**
   * Set up the worker
   */
  public setup() {
    if (this.worker) {
      return; // Already set up
    }

    // Create worker from served URL
    this.worker = getWorker(WorkerLabels.PPL);

    // Handle messages from worker
    this.worker.onmessage = (e: MessageEvent) => {
      const { id, result, error } = e.data;
      const pending = this.pendingMessages.get(id);

      if (!pending) {
        return;
      }

      this.pendingMessages.delete(id);
      if (error) {
        pending.reject(new Error(error));
        return;
      }

      pending.resolve(result);
    };

    // Handle worker errors
    this.worker.onerror = (error) => {
      // eslint-disable-next-line no-console
      console.error('PPL Worker error:', error);
    };
  }

  /**
   * Tokenize PPL content
   */
  public async tokenize(content: string): Promise<PPLToken[]> {
    if (!this.worker) {
      throw new Error('PPL Worker Proxy Service has not been setup!');
    }

    return this.sendMessage('tokenize', [content]);
  }

  /**
   * Validate PPL content and get error markers
   */
  public async validate(content: string): Promise<PPLValidationResult> {
    if (!this.worker) {
      throw new Error('PPL Worker Proxy Service has not been setup!');
    }

    return this.sendMessage('validate', [content]);
  }

  /**
   * Stop the worker
   */
  public stop() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
    }
    this.pendingMessages.clear();
  }

  /**
   * Send a message to the worker and wait for response
   */
  private sendMessage(method: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = ++this.messageId;
      this.pendingMessages.set(id, { resolve, reject });

      this.worker.postMessage({
        id,
        method,
        args,
      });

      // Set a timeout to prevent hanging
      setTimeout(() => {
        const pending = this.pendingMessages.get(id);
        if (pending) {
          this.pendingMessages.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 5000);
    });
  }
}
