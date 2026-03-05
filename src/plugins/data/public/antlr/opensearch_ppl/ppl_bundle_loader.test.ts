/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { deserializeArtifacts, PPLArtifactBundle } from './ppl_bundle_loader';

describe('PPL Bundle Loader', () => {
  const mockBundle: PPLArtifactBundle = {
    language: 'ppl',
    bundleVersion: '1.0',
    grammarHash: 'sha256:abc123',
    antlrToolVersion: '4.7.1',
    antlr4ngVersion: '3.x',
    grammarFileName: 'OpenSearchPPL.g4',
    startRuleIndex: 0,
    // Serialized ATN as number arrays (no base64 encoding)
    lexerSerializedATN: [0, 0, 0, 0],
    parserSerializedATN: [0, 0, 0, 0],
    // String arrays (not packed)
    lexerRuleNames: ['RULE1', 'RULE2'],
    parserRuleNames: ['root', 'pplStatement'],
    channelNames: ['DEFAULT_TOKEN_CHANNEL'],
    modeNames: ['DEFAULT_MODE'],
    literalNames: [null, "'search'"],
    symbolicNames: [null, 'SEARCH'],
    catalogs: {
      commands: [
        {
          name: 'source',
          description: 'Retrieve data from an index',
          snippet: 'source=${1:index}',
        },
      ],
      functions: [
        {
          name: 'count',
          signature: 'count(field)',
          description: 'Count occurrences',
        },
      ],
      keywords: [
        {
          name: 'by',
          description: 'Group by',
        },
      ],
      operators: [
        {
          name: '=',
          description: 'Equal',
        },
      ],
      snippets: [
        {
          label: 'Basic query',
          description: 'Source and filter',
          insertText: 'source=${1:index} | where ${2:field}=${3:value}',
        },
      ],
    },
  };

  describe('deserializeArtifacts', () => {
    it('should deserialize a valid bundle', () => {
      const artifacts = deserializeArtifacts(mockBundle);

      expect(artifacts).toBeDefined();
      expect(artifacts.grammarHash).toBe('sha256:abc123');
      expect(artifacts.startRuleIndex).toBe(0);
      expect(artifacts.vocabulary).toBeDefined();
    });

    it('should use string arrays correctly', () => {
      const artifacts = deserializeArtifacts(mockBundle);

      expect(artifacts.lexerRuleNames).toEqual(['RULE1', 'RULE2']);
      expect(artifacts.parserRuleNames).toEqual(['root', 'pplStatement']);
      expect(artifacts.channelNames).toEqual(['DEFAULT_TOKEN_CHANNEL']);
      expect(artifacts.modeNames).toEqual(['DEFAULT_MODE']);
    });

    it('should create vocabulary with literal and symbolic names', () => {
      const artifacts = deserializeArtifacts(mockBundle);

      expect(artifacts.vocabulary.getLiteralName(0)).toBeNull(); // null -> null (invalid token)
      expect(artifacts.vocabulary.getLiteralName(1)).toBe("'search'");
      expect(artifacts.vocabulary.getSymbolicName(0)).toBeNull(); // null -> null (invalid token)
      expect(artifacts.vocabulary.getSymbolicName(1)).toBe('SEARCH');
    });

    it('should preserve catalog data', () => {
      const artifacts = deserializeArtifacts(mockBundle);

      expect(artifacts.catalogs.commands).toHaveLength(1);
      expect(artifacts.catalogs.commands![0].name).toBe('source');

      expect(artifacts.catalogs.functions).toHaveLength(1);
      expect(artifacts.catalogs.functions![0].name).toBe('count');

      expect(artifacts.catalogs.keywords).toHaveLength(1);
      expect(artifacts.catalogs.keywords![0].name).toBe('by');

      expect(artifacts.catalogs.operators).toHaveLength(1);
      expect(artifacts.catalogs.operators![0].name).toBe('=');

      expect(artifacts.catalogs.snippets).toHaveLength(1);
      expect(artifacts.catalogs.snippets![0].label).toBe('Basic query');
    });

    it('should handle empty catalogs', () => {
      const bundleWithEmptyCatalogs = {
        ...mockBundle,
        catalogs: {},
      };

      const artifacts = deserializeArtifacts(bundleWithEmptyCatalogs);

      expect(artifacts.catalogs).toBeDefined();
      expect(artifacts.catalogs.commands).toBeUndefined();
      expect(artifacts.catalogs.functions).toBeUndefined();
    });

    it('should keep ATN arrays as number arrays', () => {
      const artifacts = deserializeArtifacts(mockBundle);

      expect(Array.isArray(artifacts.lexerATN)).toBe(true);
      expect(Array.isArray(artifacts.parserATN)).toBe(true);
      expect(artifacts.lexerATN.length).toBe(4);
      expect(artifacts.parserATN.length).toBe(4);
    });
  });
});
