/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLValidationResult, PPLToken } from './ppl_language_analyzer';
import { LintResult } from './lint/diagnostic';
import { BundleRuleOverrides } from './lint/types';
import { getWorker } from '../monaco_environment';
import { WorkerLabels } from '../worker_config';

export class PPLWorkerProxyService {
  private worker: Worker | undefined;
  private messageId = 0;
  private pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

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

  public async tokenize(content: string): Promise<PPLToken[]> {
    return this.sendMessage('tokenize', [content]);
  }

  public async validate(content: string): Promise<PPLValidationResult> {
    return this.sendMessage('validate', [content]);
  }

  public async lint(content: string, overrides?: BundleRuleOverrides): Promise<LintResult> {
    return this.sendMessage('lint', [content, overrides]);
  }

  public stop() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
    }
    this.pendingMessages.clear();
  }

  private sendMessage(method: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('PPL Worker Proxy Service has not been setup!'));
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
