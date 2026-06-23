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
import { BundleRuleOverrides } from '../lint/types';

class PPLWorkerImpl {
  private analyzer: PPLLanguageAnalyzer = getPPLLanguageAnalyzer();

  async tokenize(content: string): Promise<PPLToken[]> {
    return this.analyzer.tokenize(content);
  }

  async validate(content: string): Promise<PPLValidationResult> {
    return this.analyzer.validate(content);
  }

  async lint(content: string, overrides?: BundleRuleOverrides): Promise<LintResult> {
    return this.analyzer.lint(content, overrides ? { overrides } : undefined);
  }
}

const worker = new PPLWorkerImpl();

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

    (self as any).postMessage({
      id,
      result,
    });
  } catch (error) {
    (self as any).postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
