/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { HoverFacts } from './hover_facts';

export type LintSeverity = 'error' | 'warning' | 'info';

// Lines 1-based (ANTLR), columns 0-based (converted to Monaco 1-based in diagnostic_to_marker).
export interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface DiagnosticFix {
  title: string;
  text: string;
  range?: DiagnosticRange;
}

export type DiagnosticHoverFacts = HoverFacts;

export interface Diagnostic {
  ruleId: string;
  severity: LintSeverity;
  message: string;
  range: DiagnosticRange;
  docUrl?: string;
  fix?: DiagnosticFix;
  hoverFacts?: DiagnosticHoverFacts;
}

export interface LintResult {
  diagnostics: Diagnostic[];
}
