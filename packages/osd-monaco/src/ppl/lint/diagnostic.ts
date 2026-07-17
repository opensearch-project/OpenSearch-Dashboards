/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { HoverFacts } from './hover_facts';
import type { ExplainOutcome } from './explain/explain_types';

export type LintSeverity = 'error' | 'warning' | 'info';

// Lines 1-based, columns 0-based.
export interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export type DiagnosticHoverFacts = HoverFacts;

// A deterministic quick-fix attached to a diagnostic. The code-action provider
// turns it into a Monaco workspace edit. Attached only when the rewrite is
// unambiguous and would not re-fire the same diagnostic.
export interface DiagnosticFix {
  // Human-readable action title shown in the lightbulb menu.
  title: string;
  // Replacement text for the fix range.
  text: string;
  // Source range the fix replaces. When omitted, the fix replaces the
  // diagnostic's own `range`. Same convention as DiagnosticRange.
  range?: DiagnosticRange;
}

export interface Diagnostic {
  ruleId: string;
  severity: LintSeverity;
  message: string;
  range: DiagnosticRange;
  docUrl?: string;
  // Optional deterministic quick-fix. Absent for rules with no safe rewrite.
  fix?: DiagnosticFix;
  hoverFacts?: DiagnosticHoverFacts;
  // Internal hint set by the explain-backed detectors (which read an explain
  // plan, not a parse tree): which pipeline operation this finding relates to,
  // plus the normalized outcome and involved fields. Consumed later by the
  // runtime range/fix resolver to narrow the whole-query range to the offending
  // command; not rendered in the UI directly.
  explainTarget?: {
    operation: 'filter' | 'aggregation' | 'sort';
    outcome: ExplainOutcome;
    fields: string[];
  };
}

export interface LintResult {
  diagnostics: Diagnostic[];
}
