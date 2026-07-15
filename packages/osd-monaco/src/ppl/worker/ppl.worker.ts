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
import { LintResult } from '../lint/diagnostic';
import { LintRunContext, SerializableLintContext } from '../lint/types';

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

  async lint(content: string, context?: SerializableLintContext): Promise<LintResult> {
    if (!this.analyzer) {
      this.analyzer = getPPLLanguageAnalyzer();
    }
    if (!context) {
      return this.analyzer.lint(content);
    }
    // Rebuild the Sets/Maps that were flattened for structured-clone transfer.
    const runContext: LintRunContext = {
      isCalcite: context.isCalcite,
      fields: context.fields ? new Set(context.fields) : undefined,
      typeMap: context.typeMap ? new Map(Object.entries(context.typeMap)) : undefined,
      disabledObjectFields: context.disabledObjectFields
        ? new Set(context.disabledObjectFields)
        : undefined,
      visibleIndices: context.visibleIndices,
      settings: context.settings,
      overrides: context.overrides,
      dataSourceId: context.dataSourceId,
      dataSourceVersion: context.dataSourceVersion,
      selectedSourcePattern: context.selectedSourcePattern,
      engineType: context.engineType,
    };
    return this.analyzer.lint(content, runContext);
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
      case 'lint':
        result = await worker.lint(args[0], args[1]);
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
