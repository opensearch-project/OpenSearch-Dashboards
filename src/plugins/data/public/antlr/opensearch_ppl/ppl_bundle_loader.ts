/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PPL Autocomplete Artifact Bundle — raw JSON from backend API.
 * Endpoint: /_plugins/_ppl/_grammar
 * (proxied through OSD at /api/enhancements/ppl/grammar)
 */
export interface PPLGrammarBundle {
  bundleVersion: string;
  grammarHash: string;
  startRuleIndex: number;
  pipeStartRuleIndex?: number;

  // Serialized ATN data as number arrays
  lexerSerializedATN: number[];
  parserSerializedATN: number[];

  // String arrays (null for invalid tokens)
  lexerRuleNames: string[];
  parserRuleNames: string[];
  channelNames: string[];
  modeNames: string[];
  literalNames: Array<string | null>;
  symbolicNames: Array<string | null>;

  // Autocomplete configuration from backend
  tokenDictionary?: Record<string, number>;
  ignoredTokens?: number[];
  rulesToVisit?: number[];
}
