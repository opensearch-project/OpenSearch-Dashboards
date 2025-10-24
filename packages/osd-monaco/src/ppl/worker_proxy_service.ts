/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLValidationResult, PPLToken } from './ppl_language_analyzer';
import { ID } from './constants';

// Helper function to get base path from current location
function getBasePath(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return '';
  }

  // Extract base path from the current page URL
  // This handles cases where OpenSearch Dashboards is served from a subpath
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);

  // Handle different deployment patterns:
  // 1. Workspace URLs: /w/{workspaceId}/app/... → /w/{workspaceId}
  // 2. Custom base path: /opensearch-dashboards/app/... → /opensearch-dashboards
  // 3. Root deployment: /app/... → (empty)

  if (segments.length >= 3 && segments[0] === 'w' && segments[2] === 'app') {
    // Workspace pattern: /w/{workspaceId}/app/...
    return `/${segments[0]}/${segments[1]}`;
  } else if (segments.length >= 2 && segments[segments.length - 2] === 'app') {
    // Find where 'app' appears and take everything before it as base path
    const appIndex = segments.indexOf('app');
    if (appIndex > 0) {
      return '/' + segments.slice(0, appIndex).join('/');
    }
  } else if (segments.length > 0 && segments[0] !== 'app' && segments[0] !== 'ui') {
    // Simple case: first segment is not 'app' or 'ui'
    return `/${segments[0]}`;
  }

  return '';
}

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

    // Create worker from static URL instead of blob
    const basePath = getBasePath();
    const workerUrl = basePath + '/ui/assets/monaco-workers/ppl.editor.worker.js';

    // Debug logging to help troubleshoot worker loading
    console.log('PPL Worker Proxy Setup:', {
      pathname: window.location.pathname,
      basePath,
      workerUrl,
    });

    this.worker = new Worker(workerUrl);

    // Handle messages from worker
    this.worker.onmessage = (e: MessageEvent) => {
      const { id, result, error } = e.data;
      const pending = this.pendingMessages.get(id);

      if (pending) {
        this.pendingMessages.delete(id);
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
      }
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
