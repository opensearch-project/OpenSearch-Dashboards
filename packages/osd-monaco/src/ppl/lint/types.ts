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
}

export type Detector = (
  tree: ParserRuleContext,
  config: CatalogEntry,
  context: LintRunContext,
  ruleNameToIndex: RuleNameToIndex
) => Diagnostic[];
