/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ATN, ATNDeserializer, ATNState, RuleTransition } from 'antlr4ng';
import { SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { COMMAND_RULE_NAMES } from '@osd/monaco/ppl-lint';
import engineBundle from './__fixtures__/engine_ppl_grammar_bundle.json';

// Census guard for the shared pipeline command model (review on #12394).
//
// buildPipelineShape recognises a pipeline stage BY RULE NAME, and a name it does
// not know resolves to -1 and is skipped silently. That is not a harmless gap:
// an invisible stage is treated as order-preserving by head-without-sort, and —
// worse — the fields it creates are never registered, so field-validation reports
// them as unknown at ERROR severity on a perfectly valid query.
//
// The drift is real. The engine renamed `topCommand`/`rareCommand` to a single
// `rareTopCommand`, and the runtime grammar carries 16 further commands the
// bundled one never had. Because lookup is by name, none of that surfaced.
//
// So this test derives the command surface from each grammar rather than trusting
// a hand-maintained list, and requires every command to be classified. A new
// engine command therefore shows up here as a named, actionable failure instead
// of a silent behavioural gap.

/** Direct alternatives of a rule, read off the ATN's epsilon closure. */
function directAlternatives(atn: ATN, ruleNames: readonly string[], ruleName: string): string[] {
  const ruleIndex = ruleNames.indexOf(ruleName);
  if (ruleIndex === -1) {
    return [];
  }

  const alternatives = new Set<string>();
  const visited = new Set<number>();
  const stack: Array<ATNState | null> = [atn.ruleToStartState[ruleIndex]];

  while (stack.length > 0) {
    const state = stack.pop();
    if (!state || visited.has(state.stateNumber)) {
      continue;
    }
    visited.add(state.stateNumber);

    for (const transition of state.transitions) {
      if (transition instanceof RuleTransition) {
        alternatives.add(ruleNames[transition.ruleIndex]);
      } else if (transition.isEpsilon) {
        stack.push(transition.target);
      }
    }
  }

  return [...alternatives];
}

/**
 * Commands that can appear as a pipeline stage. `commands` covers the pipe
 * alternatives; `pplCommands` covers the initial position, where graphlookup and
 * union also appear.
 */
function pipelineCommands(atn: ATN, ruleNames: readonly string[]): string[] {
  return [
    ...new Set([
      ...directAlternatives(atn, ruleNames, 'commands'),
      ...directAlternatives(atn, ruleNames, 'pplCommands'),
    ]),
  ].sort();
}

const SURFACES: Array<{ label: string; atn: ATN; ruleNames: readonly string[] }> = [
  {
    label: 'bundled simplified grammar',
    atn: new ATNDeserializer().deserialize(SimplifiedOpenSearchPPLParser._serializedATN),
    ruleNames: SimplifiedOpenSearchPPLParser.ruleNames,
  },
  {
    label: 'captured engine grammar (3.8)',
    atn: new ATNDeserializer().deserialize(engineBundle.parserSerializedATN),
    ruleNames: engineBundle.parserRuleNames,
  },
];

describe('pipeline command census', () => {
  it.each(SURFACES.map((s) => [s.label, s] as const))(
    'classifies every pipeline command on the %s',
    (_label, surface) => {
      const commands = pipelineCommands(surface.atn, surface.ruleNames);
      // Sanity: a broken derivation returning nothing must not pass vacuously.
      expect(commands.length).toBeGreaterThan(20);

      const unclassified = commands.filter((name) => !COMMAND_RULE_NAMES.includes(name));
      expect(unclassified).toEqual([]);
    }
  );

  it('recognises top/rare under both the split and merged rule names', () => {
    // 3.6 merged topCommand + rareCommand into rareTopCommand. Both spellings
    // must stay classified so the stage is visible on either surface.
    for (const name of ['topCommand', 'rareCommand', 'rareTopCommand']) {
      expect(COMMAND_RULE_NAMES).toContain(name);
    }

    const [bundled, engine] = SURFACES;
    const bundledCommands = pipelineCommands(bundled.atn, bundled.ruleNames);
    const engineCommands = pipelineCommands(engine.atn, engine.ruleNames);

    // Pins the rename this test exists to catch, so the alias entries are not
    // later "cleaned up" as redundant.
    expect(bundledCommands).toContain('topCommand');
    expect(bundledCommands).not.toContain('rareTopCommand');
    expect(engineCommands).toContain('rareTopCommand');
    expect(engineCommands).not.toContain('topCommand');
  });
});
