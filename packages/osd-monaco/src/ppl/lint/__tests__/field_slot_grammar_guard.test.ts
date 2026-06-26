/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Grammar drift alarm for the field-slot shape pass (field_validation.ts).
//
// The shape pass hardcodes the three commands whose `source_field` slot is typed
// as a full `expression` (grok/parse/patterns). If a grammar revision adds a
// fourth such slot — or renames one of these commands — the hardcoded list goes
// silently stale: a real misparse would stop being flagged with no failing test.
// This guard re-derives the census straight from the `.g4` source and fails when
// it diverges from the list the detector iterates.

const SHAPE_COMMANDS = ['grokCommand', 'parseCommand', 'patternsCommand'];

// `<ruleName> : ... source_field = expression`, non-greedy up to the slot so a
// later `expression` elsewhere in a long rule body cannot extend the capture.
const FIELD_SLOT_RE = /(\w+)\s*:[^;]*?source_field\s*=\s*expression/g;

const GRAMMAR_FILES = {
  'full server grammar': resolve(
    __dirname,
    '../../../../../osd-antlr-grammar/src/opensearch_ppl/grammar/OpenSearchPPLParser.g4'
  ),
  'simplified grammar': resolve(
    __dirname,
    '../../../../../osd-antlr-grammar/src/opensearch_ppl_simplified/grammar/OpenSearchPPLParser.g4'
  ),
};

function fieldSlotCommands(grammarPath: string): string[] {
  const source = readFileSync(grammarPath, 'utf8');
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  FIELD_SLOT_RE.lastIndex = 0;
  while ((match = FIELD_SLOT_RE.exec(source)) !== null) {
    found.add(match[1]);
  }
  return [...found].sort();
}

describe('field-slot shape — grammar census guard', () => {
  for (const [label, grammarPath] of Object.entries(GRAMMAR_FILES)) {
    it(`the ${label} declares exactly the three source_field=expression slots`, () => {
      expect(fieldSlotCommands(grammarPath)).toEqual([...SHAPE_COMMANDS].sort());
    });
  }
});
