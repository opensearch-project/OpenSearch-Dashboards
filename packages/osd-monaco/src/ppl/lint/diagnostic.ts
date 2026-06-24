/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { HoverFacts } from './hover_facts';

export type LintSeverity = 'error' | 'warning' | 'info';

// Lines 1-based, columns 0-based.
export interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export type DiagnosticHoverFacts = HoverFacts;

export interface Diagnostic {
  ruleId: string;
  severity: LintSeverity;
  message: string;
  range: DiagnosticRange;
  docUrl?: string;
  hoverFacts?: DiagnosticHoverFacts;
}

export interface LintResult {
  diagnostics: Diagnostic[];
}
