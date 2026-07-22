/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, ParserRuleContext } from 'antlr4ng';
import { OpenSearchPPLLexer, OpenSearchPPLParser } from '@osd/antlr-grammar';
import { fieldValidationDetector } from '../rules/field_validation';
import { createRuntimeRuleNameToIndex } from '../rule_index';
import { CatalogEntry, LintRunContext } from '../types';
import { Diagnostic } from '../diagnostic';

// Feature B — field-slot shape validation for grok/parse/patterns.
//
// The shape pass fires on the runtime-bundle surface, where `grok field=body`
// parses cleanly as a comparison (a silent misparse). The full compiled grammar
// (`OpenSearchPPLParser`) is the in-repo proxy for that surface: it produces the
// same `comparisonExpression`/`fieldExpression`/`literalValue` structure the
// deserialized runtime ATN does, so building trees from it exercises the exact
// predicate that runs in production on engines >= 3.6.

const config: CatalogEntry = {
  id: 'field-validation',
  detector: 'field-validation',
  enabled: true,
  severity: 'warning',
  message: 'Reference to an unknown field.',
  docUrl: 'https://docs.opensearch.org/latest/sql-and-ppl/ppl/commands/fields/',
  appliesTo: {},
};

// The full compiled grammar uses the same rule names as the runtime bundle for
// the four rules the predicate touches, so its rule-name->index map stands in
// for the runtime map.
const ruleNameToIndex = createRuntimeRuleNameToIndex(
  new Map(OpenSearchPPLParser.ruleNames.map((name, idx) => [name, idx]))
);

function buildTree(query: string): ParserRuleContext {
  const lexer = new OpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new OpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

function shapeDiagnostics(query: string, surface?: LintRunContext['grammarSurface']): Diagnostic[] {
  const tree = buildTree(query);
  const context: LintRunContext = surface ? { grammarSurface: surface } : {};
  return fieldValidationDetector(tree, config, context, ruleNameToIndex);
}

describe('field-slot shape (runtime-bundle proxy)', () => {
  describe('flags Splunk-style field= and other non-field expressions', () => {
    it('flags grok field=body at the configured severity with a remove-field= fix', () => {
      const diags = shapeDiagnostics('source=t | grok field=body "x"', 'runtime-bundle');
      expect(diags).toHaveLength(1);
      expect(diags[0].ruleId).toBe('field-validation');
      expect(diags[0].severity).toBe(config.severity);
      expect(diags[0].fix?.text).toBe('body');
      expect(diags[0].message).toContain('grok');
      expect(diags[0].message).toContain('field name');
      // The message is deliberately generic — this pass flags any non-bare-field
      // shape (`> 1`, `= x`, literals, arithmetic), not only Splunk `field=` — so
      // it must not claim a Splunk-specific cause.
      expect(diags[0].message).not.toContain('Splunk');
    });

    it('flags grok field = body (spaced) the same way', () => {
      const diags = shapeDiagnostics('source=t | grok field = body "x"', 'runtime-bundle');
      expect(diags).toHaveLength(1);
      expect(diags[0].fix?.text).toBe('body');
    });

    it('flags parse field=message with a fix to the bare field', () => {
      const diags = shapeDiagnostics('source=t | parse field=message "x"', 'runtime-bundle');
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe(config.severity);
      expect(diags[0].fix?.text).toBe('message');
      expect(diags[0].message).toContain('parse');
    });

    it('flags patterns field=body', () => {
      const diags = shapeDiagnostics('source=t | patterns field=body', 'runtime-bundle');
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe(config.severity);
      expect(diags[0].fix?.text).toBe('body');
      expect(diags[0].message).toContain('patterns');
    });

    it('flags a non-equality comparison but offers NO fix', () => {
      const diags = shapeDiagnostics('source=t | grok status > 200 "x"', 'runtime-bundle');
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe(config.severity);
      expect(diags[0].fix).toBeUndefined();
    });

    it('flags a function-wrapped field but offers NO fix', () => {
      const diags = shapeDiagnostics('source=t | grok upper(body) "x"', 'runtime-bundle');
      expect(diags).toHaveLength(1);
      expect(diags[0].fix).toBeUndefined();
    });

    it('flags a bare literal but offers NO fix', () => {
      const diags = shapeDiagnostics('source=t | grok 200 "x"', 'runtime-bundle');
      expect(diags).toHaveLength(1);
      expect(diags[0].fix).toBeUndefined();
    });
  });

  describe('does NOT flag a bare field reference', () => {
    it('grok body', () => {
      expect(shapeDiagnostics('source=t | grok body "x"', 'runtime-bundle')).toEqual([]);
    });

    it('grok a.b.c (dotted)', () => {
      expect(shapeDiagnostics('source=t | grok a.b.c "x"', 'runtime-bundle')).toEqual([]);
    });

    it('patterns message', () => {
      expect(shapeDiagnostics('source=t | patterns message', 'runtime-bundle')).toEqual([]);
    });
  });

  describe('surface gate', () => {
    it('uses source text on the compiled-simplified surface', () => {
      const query = 'source=t | grok field=body "x"';
      const tree = buildTree(query);
      const diags = fieldValidationDetector(
        tree,
        config,
        { grammarSurface: 'compiled-simplified', sourceText: query },
        ruleNameToIndex
      );

      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe(config.severity);
      expect(diags[0].fix?.text).toBe('body');
    });

    it('self-suppresses on compiled-simplified when source text is absent', () => {
      expect(shapeDiagnostics('source=t | grok field=body "x"', 'compiled-simplified')).toEqual([]);
    });
  });

  // A `cast(field AS <type>)` registers `field` as cast input, never the target
  // type, as a created field. Before the convertedDataType guard the node after
  // the `AS` terminal (the type name) was added to createdFields, so a later
  // reference to that type name was silently accepted. Verified on the runtime
  // proxy where some type spellings (`date`, `ip`) lex as identifiers downstream.
  describe('cast target type is not a created field', () => {
    const withFields = (query: string): Diagnostic[] => {
      const context: LintRunContext = {
        grammarSurface: 'runtime-bundle',
        fields: new Set<string>(['age', 'name']),
      };
      return fieldValidationDetector(buildTree(query), config, context, ruleNameToIndex);
    };

    it('flags a later reference to the cast TYPE name (date), not silently allowing it', () => {
      const diags = withFields('source=t | eval y = cast(age as date) | fields date');
      expect(diags.map((d) => d.message)).toEqual([
        expect.stringContaining('Unknown field "date"'),
      ]);
    });

    it('still treats the eval TARGET as a known field downstream', () => {
      expect(withFields('source=t | eval y = cast(age as date) | fields y')).toEqual([]);
    });
  });

  // The shape pass must emit at the rule's configured severity, not a hardcoded
  // `error`. A rule has one catalog entry and one user-facing toggle; if a user
  // sets field-validation to `warning`/`info`, the shape finding follows.
  describe('honors the configured severity', () => {
    const shapeWith = (severity: CatalogEntry['severity']): Diagnostic[] =>
      fieldValidationDetector(
        buildTree('source=t | grok field=body "x"'),
        { ...config, severity },
        { grammarSurface: 'runtime-bundle' },
        ruleNameToIndex
      );

    it('emits warning when the rule is configured as warning', () => {
      const diags = shapeWith('warning');
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe('warning');
    });

    it('emits info when the rule is configured as info', () => {
      const diags = shapeWith('info');
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe('info');
    });

    it('emits error when the rule is configured as error', () => {
      const diags = shapeWith('error');
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe('error');
    });
  });

  // The source/index keyword skip is a compiled-simplified-grammar workaround
  // (there `source=idx` misparses the keyword into a fieldExpression). On the
  // runtime bundle `source=idx` is an excluded fromClause, so a fieldExpression
  // whose text is `source`/`index` is a genuine field reference and must be
  // validated like any other.
  describe('source/index keyword is validated on the runtime surface', () => {
    const withFields = (query: string, fields: string[]): Diagnostic[] =>
      fieldValidationDetector(
        buildTree(query),
        config,
        { grammarSurface: 'runtime-bundle', fields: new Set<string>(fields) },
        ruleNameToIndex
      );

    it('flags an unknown field literally named `source`', () => {
      expect(
        withFields('source=t | where source = 5', ['age', 'status']).map((d) => d.message)
      ).toEqual([expect.stringContaining('Unknown field "source"')]);
    });

    it('flags an unknown field literally named `index`', () => {
      expect(
        withFields('source=t | where index = 5', ['age', 'status']).map((d) => d.message)
      ).toEqual([expect.stringContaining('Unknown field "index"')]);
    });

    it('does NOT flag `source` when it is a real field on the index', () => {
      expect(withFields('source=t | where source = 5', ['age', 'status', 'source'])).toEqual([]);
    });

    it('keeps the skip on the compiled fallback path (no surface set)', () => {
      // No grammarSurface = compiled/test path: the workaround stays active so a
      // misparsed source-first keyword is not falsely flagged.
      const diags = fieldValidationDetector(
        buildTree('source=t | where source = 5'),
        config,
        { fields: new Set<string>(['age', 'status']) },
        ruleNameToIndex
      );
      expect(diags).toEqual([]);
    });
  });

  describe('overlap suppression', () => {
    it('does not co-emit an "Unknown field" existence finding for field=body', () => {
      const tree = buildTree('source=t | grok field=body "x"');
      // A field set that lacks both `field` and `body` would normally make the
      // existence pass fire on each; the shape finding must swallow both.
      const context: LintRunContext = {
        grammarSurface: 'runtime-bundle',
        fields: new Set<string>(['unrelated']),
      };
      const diags = fieldValidationDetector(tree, config, context, ruleNameToIndex);
      const unknownFieldMessages = diags.filter((d) => d.message.startsWith('Unknown field'));
      expect(unknownFieldMessages).toEqual([]);
      // Exactly the one shape error survives.
      expect(diags).toHaveLength(1);
      expect(diags[0].severity).toBe(config.severity);
    });
  });
});
