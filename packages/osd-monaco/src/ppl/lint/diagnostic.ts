/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExplainOutcome } from './explain/explain_types';

export type LintSeverity = 'error' | 'warning' | 'info';

// Lines 1-based, columns 0-based.
export interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

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
  // Exact source slice expected at `range`; guards stale code actions and lets
  // the probe layer locate the predicate inside a candidate's source text.
  expectedText?: string;
}

/**
 * How a whole-query explain finding was narrowed to a single source command.
 * `unique-source` means exactly one candidate command matched the flagged
 * operation; `causal-probe` means bounded control/treatment `_explain` probes
 * pinned the culprit among several candidates. Retained inside Dashboards only.
 */
export interface DiagnosticAttribution {
  confidence: 'unique-source' | 'causal-probe';
  candidateId: string;
  relatedRanges?: DiagnosticRange[];
}

// Per-instance AI-fix policy a detector attaches to a diagnostic. Absence
// preserves the generic behavior (AI offered for any marker with no
// deterministic fix); an explicit `eligible: false` hides AI for this
// diagnostic only.
export interface DiagnosticAiFix {
  // Whether this specific diagnostic instance has a validated automatic path.
  eligible: boolean;
  // Rule-specific constraints appended to the model's hidden fix context.
  instructions?: string;
}

export interface Diagnostic {
  ruleId: string;
  severity: LintSeverity;
  message: string;
  range: DiagnosticRange;
  docUrl?: string;
  // Optional deterministic quick-fix. Absent for rules with no safe rewrite.
  fix?: DiagnosticFix;
  // Optional per-instance AI policy. Absence preserves the generic no-template
  // fallback; an explicit false hides AI for this diagnostic only.
  aiFix?: DiagnosticAiFix;
  // Source attribution retained inside Dashboards only; set by the explain
  // range resolver once a whole-query finding is narrowed to one command.
  attribution?: DiagnosticAttribution;
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
