/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import 'regenerator-runtime/runtime';
import {
  getPPLLanguageAnalyzer,
  PPLLanguageAnalyzer,
  PPLToken,
  PPLValidationResult,
} from '../ppl_language_analyzer';

// Simple worker implementation that doesn't depend on Monaco's internal modules
class PPLWorkerImpl {
  private analyzer: PPLLanguageAnalyzer;

  async tokenize(content: string): Promise<PPLToken[]> {
    if (!this.analyzer) {
      this.analyzer = getPPLLanguageAnalyzer();
    }
    return this.analyzer.tokenize(content);
  }

  async validate(content: string): Promise<PPLValidationResult> {
    if (!this.analyzer) {
      this.analyzer = getPPLLanguageAnalyzer();
    }
    return this.analyzer.validate(content);
  }
}

// Initialize worker
const worker = new PPLWorkerImpl();

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  const { id, method, args } = e.data;

  try {
    let result: any;
    switch (method) {
      case 'tokenize':
        result = await worker.tokenize(args[0]);
        break;
      case 'validate':
        result = await worker.validate(args[0]);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }

    // Send result back to main thread
    (self as any).postMessage({
      id,
      result,
    });
  } catch (error) {
    // Send error back to main thread
    (self as any).postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
