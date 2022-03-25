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

const babelEslint = require('babel-eslint');

const { assert, normalizeWhitespace, init } = require('../lib');

function isHashbang(text) {
  return text.trim().startsWith('#!') && !text.trim().includes('\n');
}

module.exports = {
  meta: {
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          licenses: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: (context) => {
    return {
      Program(program) {
        const licenses = init(context, program, function () {
          const options = context.options[0] || {};
          const licenses = options.licenses;

          assert(!!licenses, '"licenses" option is required');

          return licenses.map((license, i) => {
            const parsed = babelEslint.parse(license);
            assert(
              !parsed.body.length,
              `"licenses[${i}]" option must only include a single comment`
            );
            assert(
              parsed.comments.length === 1,
              `"licenses[${i}]" option must only include a single comment`
            );

            return {
              source: license,
              nodeValue: normalizeWhitespace(parsed.comments[0].value),
            };
          });
        });

        if (!licenses || !licenses.length) return;

        const sourceCode = context.getSourceCode();
        const comment = sourceCode
          .getAllComments()
          .find((node) =>
            licenses.map((license) => license.nodeValue).includes(normalizeWhitespace(node.value))
          );

        // no licence comment
        if (!comment) {
          context.report({
            message: 'File must start with a license header',
            loc: {
              start: { line: 1, column: 0 },
              end: { line: 1, column: sourceCode.lines[0].length - 1 },
            },
            fix(fixer) {
              if (isHashbang(sourceCode.lines[0])) {
                return undefined;
              }

              return fixer.replaceTextRange([0, 0], licenses[0].source + '\n\n');
            },
          });
          return;
        }

        // ensure there is nothing before the comment
        const currentLicense = licenses.find(
          (license) => normalizeWhitespace(comment.value) === license.nodeValue
        );
        const sourceBeforeNode = sourceCode
          .getText()
          .slice(0, sourceCode.getIndexFromLoc(comment.loc.start));
        if (sourceBeforeNode.length && !isHashbang(sourceBeforeNode)) {
          context.report({
            node: comment,
            message: 'License header must be at the very beginning of the file',
            fix(fixer) {
              // replace leading whitespace if possible
              if (sourceBeforeNode.trim() === '') {
                return fixer.replaceTextRange([0, sourceBeforeNode.length], '');
              }

              // inject content at top and remove node from current location
              // if removing whitespace is not possible
              return [
                fixer.remove(comment),
                fixer.replaceTextRange([0, 0], currentLicense.source + '\n\n'),
              ];
            },
          });
        }
      },
    };
  },
};
