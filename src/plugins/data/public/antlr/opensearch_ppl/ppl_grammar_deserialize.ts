/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Node-safe deserializer that turns a raw PPL grammar bundle (the JSON served by
 * `GET /_plugins/_ppl/_grammar`, proxied through OSD at
 * `/api/enhancements/ppl/grammar`) into a `CachedGrammar` ready for the
 * interpreter-based runtime parser.
 *
 * This module imports ONLY `antlr4ng` for values, plus two type-only imports
 * (`PPLGrammarBundle`, `TokenDictionary`) that babel erases. It therefore loads
 * in a plain Node process — no Monaco, no `opensearch-dashboards/public` path
 * alias, no HTTP client, no singleton cache. Two callers share it:
 *
 *  - the browser-only `PPLGrammarCache.doFetch`, which deserializes the bundle
 *    it fetches over HTTP (the hot editor path); and
 *  - the headless lint API (`headless_ppl_lint.ts`), which the SQL CI validation
 *    runner loads by deep path to lint against a candidate bundle without
 *    launching OSD.
 *
 * Keeping the ATN deserialization here — instead of duplicating it in the CI
 * runner — is what lets the SQL workflow validate against OSD's *production*
 * parse-tree shape. A divergent copy would silently change diagnostics.
 */

import { ATN, ATNDeserializer, Vocabulary } from 'antlr4ng';
import { PPLGrammarBundle } from './ppl_bundle_loader';
import { TokenDictionary } from '../opensearch_sql/table';

/**
 * ATN deserialization options. These must stay byte-for-byte identical between
 * the browser cache and the headless API: changing `verifyATN` or
 * `generateRuleBypassTransitions` alters the parse tree the interpreter
 * produces, which would silently change which lint diagnostics fire.
 */
const ATN_DESERIALIZE_OPTIONS = {
  readOnly: false,
  verifyATN: true,
  generateRuleBypassTransitions: true,
};

export interface CachedGrammar {
  lexerATN: ATN;
  parserATN: ATN;
  vocabulary: Vocabulary;
  lexerRuleNames: string[];
  parserRuleNames: string[];
  channelNames: string[];
  modeNames: string[];
  startRuleIndex: number;
  pipeStartRuleIndex?: number;
  grammarHash: string;
  tokenDictionary: TokenDictionary;
  ignoredTokens: number[];
  rulesToVisit: number[];
  runtimeSymbolicNameToTokenType: Map<string, number>;
  runtimeRuleNameToIndex: Map<string, number>;
}

function buildSymbolicNameToTokenType(symbolicNames: Array<string | null>): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 1; i < symbolicNames.length; i++) {
    const name = symbolicNames[i];
    if (name) map.set(name, i);
  }
  return map;
}

function buildRuleNameToIndex(parserRuleNames: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < parserRuleNames.length; i++) {
    map.set(parserRuleNames[i], i);
  }
  return map;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isStringOrNullArray(value: unknown): value is Array<string | null> {
  return Array.isArray(value) && value.every((item) => item === null || typeof item === 'string');
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

function isRecordOfNumbers(value: unknown): value is Record<string, number> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

export function isValidBundleShape(bundle: unknown): bundle is PPLGrammarBundle {
  if (typeof bundle !== 'object' || bundle === null) {
    return false;
  }

  const candidate = bundle as Partial<PPLGrammarBundle>;

  if (
    !isNumberArray(candidate.lexerSerializedATN) ||
    !isNumberArray(candidate.parserSerializedATN) ||
    !isStringArray(candidate.lexerRuleNames) ||
    !isStringArray(candidate.parserRuleNames) ||
    !isStringArray(candidate.channelNames) ||
    !isStringArray(candidate.modeNames) ||
    !isStringOrNullArray(candidate.literalNames) ||
    !isStringOrNullArray(candidate.symbolicNames) ||
    !isFiniteInteger(candidate.startRuleIndex) ||
    typeof candidate.grammarHash !== 'string'
  ) {
    return false;
  }

  if (
    candidate.startRuleIndex < 0 ||
    candidate.startRuleIndex >= candidate.parserRuleNames.length
  ) {
    return false;
  }

  if (
    candidate.pipeStartRuleIndex !== undefined &&
    (!isFiniteInteger(candidate.pipeStartRuleIndex) ||
      candidate.pipeStartRuleIndex < 0 ||
      candidate.pipeStartRuleIndex >= candidate.parserRuleNames.length)
  ) {
    return false;
  }

  if (candidate.tokenDictionary !== undefined && !isRecordOfNumbers(candidate.tokenDictionary)) {
    return false;
  }

  if (candidate.ignoredTokens !== undefined && !isNumberArray(candidate.ignoredTokens)) {
    return false;
  }

  if (candidate.rulesToVisit !== undefined && !isNumberArray(candidate.rulesToVisit)) {
    return false;
  }

  return true;
}

/**
 * Deserialize a raw grammar bundle into a `CachedGrammar`.
 *
 * Returns `null` when the bundle fails shape validation. It intentionally does
 * NOT swallow exceptions thrown by `ATNDeserializer.deserialize` (e.g. a
 * corrupt ATN that passes shape validation): those propagate to the caller.
 * The browser cache wraps this call in a try/catch that turns any throw into a
 * silent fallback, while the CI-facing headless API lets the throw surface so a
 * regression fails loudly instead of vacuously linting an empty tree.
 */
export function deserializeGrammarBundle(bundle: unknown): CachedGrammar | null {
  if (!isValidBundleShape(bundle)) {
    return null;
  }

  const literalNames = (bundle.literalNames || []).map((n) => (n === '' ? null : n));
  const symbolicNames = (bundle.symbolicNames || []).map((n) => (n === '' ? null : n));
  const vocabulary = new Vocabulary(literalNames, symbolicNames);

  const lexerATN = new ATNDeserializer(ATN_DESERIALIZE_OPTIONS).deserialize(
    bundle.lexerSerializedATN
  );
  const parserATN = new ATNDeserializer(ATN_DESERIALIZE_OPTIONS).deserialize(
    bundle.parserSerializedATN
  );

  return {
    lexerATN,
    parserATN,
    vocabulary,
    lexerRuleNames: bundle.lexerRuleNames,
    parserRuleNames: bundle.parserRuleNames,
    channelNames: bundle.channelNames,
    modeNames: bundle.modeNames,
    startRuleIndex: bundle.startRuleIndex,
    pipeStartRuleIndex: bundle.pipeStartRuleIndex,
    grammarHash: bundle.grammarHash,
    // @ts-expect-error TS2352 TODO(ts-error): fixme
    tokenDictionary: (bundle.tokenDictionary ?? {}) as TokenDictionary,
    ignoredTokens: bundle.ignoredTokens ?? [],
    rulesToVisit: bundle.rulesToVisit ?? [],
    runtimeSymbolicNameToTokenType: buildSymbolicNameToTokenType(bundle.symbolicNames),
    runtimeRuleNameToIndex: buildRuleNameToIndex(bundle.parserRuleNames),
  };
}
