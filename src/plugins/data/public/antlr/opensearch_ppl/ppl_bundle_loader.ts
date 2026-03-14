/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vocabulary } from 'antlr4ng';

/**
 * PPL Autocomplete Artifact Bundle — raw JSON from backend API.
 * Endpoint: /_plugins/_ppl/_grammar
 * (proxied through OSD at /api/enhancements/ppl/grammar)
 */
export interface PPLGrammarBundle {
  language: string;
  bundleVersion: string;
  grammarHash: string;
  antlrToolVersion: string;
  antlr4ngVersion: string;
  grammarFileName: string;
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

  // Language catalogs
  catalogs: {
    commands?: Array<{
      name: string;
      description: string;
      syntax?: string;
      snippet?: string;
      relatedCommands?: string[];
      documentation?: string;
    }>;
    keywords?: Array<{
      name: string;
      description: string;
    }>;
    functions?: Array<{
      name: string;
      signature: string;
      description: string;
      snippet?: string;
      returnType?: string;
      documentation?: string;
    }>;
    operators?: Array<{
      name: string;
      description: string;
      type?: string;
    }>;
    snippets?: Array<{
      label: string;
      description: string;
      insertText: string;
      prefix?: string;
    }>;
  };
}

/**
 * Deserialized and ready-to-use PPL artifacts.
 * ATN arrays are kept as number[] for the ATNDeserializer;
 * actual ATN objects are created and cached by PPLGrammarCache.
 */
export interface PPLArtifacts {
  lexerATN: number[];
  parserATN: number[];
  lexerRuleNames: string[];
  parserRuleNames: string[];
  channelNames: string[];
  modeNames: string[];
  vocabulary: Vocabulary;
  startRuleIndex: number;
  catalogs: PPLGrammarBundle['catalogs'];
  grammarHash: string;
}

/**
 * Deserialize a raw artifact bundle into ready-to-use artifacts.
 * Creates the ANTLR Vocabulary from literal/symbolic name arrays.
 * Does NOT deserialize ATN objects — that is handled by PPLGrammarCache.
 */
export function deserializeArtifacts(bundle: PPLGrammarBundle): PPLArtifacts {
  const literalNames = (bundle.literalNames || []).map((n) => (n === '' ? null : n));
  const symbolicNames = (bundle.symbolicNames || []).map((n) => (n === '' ? null : n));
  const vocabulary = new Vocabulary(literalNames, symbolicNames);

  return {
    lexerATN: bundle.lexerSerializedATN,
    parserATN: bundle.parserSerializedATN,
    lexerRuleNames: bundle.lexerRuleNames,
    parserRuleNames: bundle.parserRuleNames,
    channelNames: bundle.channelNames,
    modeNames: bundle.modeNames,
    vocabulary,
    startRuleIndex: bundle.startRuleIndex,
    catalogs: bundle.catalogs,
    grammarHash: bundle.grammarHash,
  };
}
