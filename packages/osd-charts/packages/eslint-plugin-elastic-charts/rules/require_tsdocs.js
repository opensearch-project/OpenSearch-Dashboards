/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const utils = require('./utils');

function fixLineComment({ range, value }) {
  return {
    value: `/**\n * ${value.trim()}\n */`,
    range,
  };
}

function fixBlockComment({ range, value }) {
  const content = value.trim();

  return {
    value: /\n/.test(value) ? `/**\n ${content}\n */` : `/**\n * ${content}\n */`,
    range,
  };
}

module.exports = {
  meta: {
    fixable: 'code',
    type: 'problem',
  },
  create(context) {
    return {
      // eslint-disable-next-line func-names
      'ExportNamedDeclaration[specifiers=""]:not(ExportAllDeclaration)': function (node) {
        const variableName = utils.getExportName(node);
        const comment = utils.getCommentBefore(context, node);

        if (!comment) {
          context.report({
            loc: node.loc,
            message: 'Missing TSDoc comment for {{ variableName }}',
            data: {
              variableName,
            },
            fix(fixer) {
              const value = `/**  */\n`;
              return fixer.insertTextBefore(node, value);
            },
          });
        } else {
          if (comment.type === 'Line') {
            context.report({
              loc: comment.loc,
              message: 'Use TSDoc comment for {{ variableName }}',
              data: {
                variableName,
              },
              fix(fixer) {
                const {
                  range: [rangeStart],
                  value,
                } = fixLineComment(comment);
                return fixer.replaceTextRange([rangeStart, node.range[0] - 1], value);
              },
            });
          } else {
            if (!comment.value.startsWith('*')) {
              context.report({
                loc: comment.loc,
                message: 'Comment is not TSDoc format for {{ variableName }}',
                data: {
                  variableName,
                },
                fix(fixer) {
                  const { range, value } = fixBlockComment(comment);
                  return fixer.replaceTextRange(range, value);
                },
              });
            }
          }
        }
      },
    };
  },
};
