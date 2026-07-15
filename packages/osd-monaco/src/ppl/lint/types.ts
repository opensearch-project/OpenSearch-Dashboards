/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext } from 'antlr4ng';
import { Diagnostic, LintSeverity } from './diagnostic';
import { RuleNameToIndex } from './rule_index';

export interface AppliesTo {
  minVersion?: string;
  maxVersion?: string;
  engine?: 'calcite';
}

export interface CatalogEntry {
  id: string;
  detector: string;
  enabled: boolean;
  severity: LintSeverity;
  message: string;
  docUrl: string;
  appliesTo: AppliesTo;
  runtimeOnly?: boolean;
  needsContext?: boolean;
  needsExplain?: boolean;
  /**
   * Whether an AI-assisted quick fix may be offered for this rule's markers.
   * The flag is owned by the catalog (this schema); a feature PR sets it on the
   * rows it wants AI-fixable, and the AI contributor reads it generically without
   * importing any rule. Undefined/false means no AI action is offered.
   */
  aiFixable?: boolean;
}

export type BundleRuleOverrides = Record<string, Partial<CatalogEntry>>;

export interface LintPayloadContext {
  isCalcite?: boolean;
  fields?: Set<string>;
  typeMap?: Map<string, string>;
  disabledObjectFields?: Set<string>;
  visibleIndices?: string[];
  settings?: { allJoinTypesAllowed?: boolean };
  overrides?: BundleRuleOverrides;
  /**
   * Identity of the source the field/type metadata was loaded for. Exposed by
   * the context builder only when the loaded data view's dataset id, data source
   * id, and dataset type all match the query's active dataset — so a rule can
   * trust that `fields`/`typeMap` describe this exact source and is not a stale
   * carryover. Absent when provenance cannot be established.
   */
  selectedSourcePattern?: string;
  /**
   * Data source engine classification carried into lint context so a
   * Calcite-only rule can reject an Elasticsearch-compatible source. Derived
   * from `dataSource.engineType ?? dataSource.type` at the host.
   */
  engineType?: string;
  // Whether the command-typo suggestion (a syntax-channel UX layer, not a lint
  // rule) is enabled. Undefined means enabled; only `false` turns it off. Carried
  // on the lint context because the syntax marker builder reads it alongside the
  // lint config, though it does not affect any tree-walking lint rule.
  commandSuggestionEnabled?: boolean;
}

export interface LintRunContext extends LintPayloadContext {
  dataSourceId?: string;
  dataSourceVersion?: string;
  /**
   * Original source text, used by detectors that need a narrow text-side
   * fallback on the compiled grammar surface (e.g. field-validation's field-slot
   * shape pass, which cannot read `grok field=body` off the simplified parse
   * tree). Set by `PPLLanguageAnalyzer.lint`; absent on the runtime bridge path.
   */
  sourceText?: string;
  grammarSurface?: 'compiled-simplified' | 'runtime-bundle';
  grammarHash?: string;
  /**
   * Whether the linted query is pipe-first (`| where ...`). Derived run-local
   * from the query text by the lint runner so rules that care about a leading
   * source do not each re-derive it. Absent means "not determined".
   */
  isPipeFirst?: boolean;
}

/**
 * Structured-clone-safe mirror of the lint context for passing to the compiled
 * worker over postMessage. Sets/Maps are flattened to arrays/objects and the
 * non-cloneable http client is omitted; the worker reconstitutes the Sets/Maps.
 */
export interface SerializableLintContext {
  isCalcite?: boolean;
  fields?: string[];
  typeMap?: Record<string, string>;
  disabledObjectFields?: string[];
  visibleIndices?: string[];
  settings?: { allJoinTypesAllowed?: boolean };
  overrides?: BundleRuleOverrides;
  dataSourceId?: string;
  dataSourceVersion?: string;
  selectedSourcePattern?: string;
  engineType?: string;
}

export type Detector = (
  tree: ParserRuleContext,
  config: CatalogEntry,
  context: LintRunContext,
  ruleNameToIndex: RuleNameToIndex
) => Diagnostic[];
