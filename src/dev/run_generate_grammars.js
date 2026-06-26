/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const fs = require('fs');
const path = require('path');
const peg = require('pegjs');

const REPO_ROOT = path.resolve(__dirname, '../..');

// Emitted at the top of each generated parser file. Must byte-match the
// header previously produced by the grunt-peg wrapper so that no-op
// regenerations produce no diff.
const HEADER =
  '/*\n' +
  ' * SPDX-License-Identifier: Apache-2.0\n' +
  ' *\n' +
  ' * The OpenSearch Contributors require contributions made to\n' +
  ' * this file be licensed under the Apache-2.0 license or a\n' +
  ' * compatible open source license.\n' +
  ' *\n' +
  ' * Any modifications Copyright OpenSearch Contributors. See\n' +
  ' * GitHub history for details.\n' +
  ' */\n' +
  '\n';

// List of PEG grammars that ship generated parsers in this repo.
// Keep this table in sync with the `.peg` sources discovered by:
//   find . -name '*.peg' -not -path './node_modules/*'
// (`packages/osd-interpreter` has its own generation pipeline and is
// intentionally not included here.)
const GRAMMARS = [
  {
    name: 'kuery',
    src: 'src/plugins/data/common/opensearch_query/kuery/ast/kuery.peg',
    dest: 'src/plugins/data/common/opensearch_query/kuery/ast/_generated_/kuery.js',
    pegOptions: { allowedStartRules: ['start', 'Literal'] },
  },
  {
    name: 'timeline_chain',
    src: 'src/plugins/vis_type_timeline/common/chain.peg',
    dest: 'src/plugins/vis_type_timeline/common/_generated_/chain.js',
    pegOptions: {},
  },
];

// PEG.js exposes different entry points across versions:
//   0.9.x — `buildParser(source, opts)`
//   0.10.x — `generate(source, opts)`
// Supporting both lets this script survive a future pegjs bump without
// silently breaking. Note `buildParser` in 0.9 relies on `this` context,
// so we invoke via the module (not a detached reference).
function compile(grammarSource, options) {
  if (typeof peg.generate === 'function') {
    return peg.generate(grammarSource, options);
  }
  return peg.buildParser(grammarSource, options);
}

function wrap(parserSource) {
  return HEADER + 'module.exports = ' + parserSource + ';\n';
}

function generateOne(grammar) {
  const srcPath = path.resolve(REPO_ROOT, grammar.src);
  const destPath = path.resolve(REPO_ROOT, grammar.dest);
  const grammarSource = fs.readFileSync(srcPath, 'utf8');
  const parserSource = compile(grammarSource, {
    ...grammar.pegOptions,
    output: 'source',
  });
  const output = wrap(parserSource);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, output, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`  ${grammar.name}: ${grammar.src} -> ${grammar.dest}`);
}

// eslint-disable-next-line no-console
console.log('Generating PEG parsers...');
for (const grammar of GRAMMARS) {
  generateOne(grammar);
}
// eslint-disable-next-line no-console
console.log('Done.');
