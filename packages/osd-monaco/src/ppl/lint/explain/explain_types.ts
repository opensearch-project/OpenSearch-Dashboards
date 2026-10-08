/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from '../diagnostic';
import { CatalogEntry } from '../types';

export type ExplainOperation = 'filter' | 'aggregation' | 'sort';

/**
 * A normalized execution outcome inferred from an explain plan. These values
 * are internal to Dashboards; they are never sent to or read from OpenSearch.
 */
export type ExplainOutcome =
  | 'filter:native'
  | 'filter:script'
  | 'filter:coordinator'
  | 'aggregation:native'
  | 'aggregation:coordinator'
  | 'sort:native'
  | 'sort:script'
  | 'sort:coordinator';

export interface ExplainOutcomeEvidence {
  outcome: ExplainOutcome;
  /** A tree rel id when available, otherwise the legacy plan line (`line:N`). */
  scope: string;
  format: 'tree' | 'legacy';
}

export function operationForOutcome(outcome: ExplainOutcome): ExplainOperation {
  return outcome.slice(0, outcome.indexOf(':')) as ExplainOperation;
}

/**
 * One rel node from the machine-readable `json_tree` explain format. Keep this
 * permissive: Calcite's RelJsonWriter can add operator-specific fields, and the
 * linter only needs a few stable signals.
 */
export interface ExplainRelNode {
  id?: string;
  relOp?: string;
  inputs?: string[];
  PushDownContext?: unknown;
  sourceBuilder?: unknown;
  [key: string]: unknown;
}

/** The logical or physical rel tree returned by `_explain?format=json_tree`. */
export interface ExplainRelTree {
  rels?: ExplainRelNode[];
  [key: string]: unknown;
}

/**
 * The physical/logical plan returned by `POST /_plugins/_ppl/_explain`, narrowed
 * to what the explain detectors read.
 *
 * New clusters return `{ calcite: { logical, physical } }` where logical and
 * physical are rel-tree objects. During migration, older clusters may still
 * return logical/physical as strings; keep optional text fields as a fallback.
 * On a non-Calcite cluster the host produces `isCalcite: false`, which makes
 * every detector no-op.
 */
export interface ExplainPlan {
  /** True only when the response carried a usable Calcite plan. */
  isCalcite: boolean;
  /** Machine-readable physical plan, preferred when available. */
  physicalTree?: ExplainRelTree;
  /** Machine-readable logical plan, preferred when available. */
  logicalTree?: ExplainRelTree;
  /** Legacy physical plan text fallback. */
  physicalText?: string;
  /** Legacy logical plan text fallback. */
  logicalText?: string;
}

/**
 * Per-run inputs an explain detector consumes alongside the plan. Kept separate
 * from `LintRunContext` (the tree-pass context) because explain rules carry the
 * raw query text — used to range the whole-query diagnostic — rather than a
 * parse tree.
 */
export interface ExplainLintContext {
  /** The user's query text, used to size the whole-query diagnostic range. */
  query: string;
}

/**
 * An explain-backed detector. Mirrors the tree-based {@link Detector} contract
 * but reads the {@link ExplainPlan} instead of a parse tree. Returns zero or
 * more diagnostics. Must no-op when `plan.isCalcite` is false.
 */
export type ExplainDetector = (
  plan: ExplainPlan,
  config: CatalogEntry,
  context: ExplainLintContext
) => Diagnostic[];
