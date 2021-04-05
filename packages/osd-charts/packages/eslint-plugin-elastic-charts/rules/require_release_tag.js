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

const { INTERNAL_TAG, DEFAULT_TAG } = require('./constants');
const utils = require('./utils');

const emptyLineComment = '*';
const emptyBlockComment = '*\n *';

function isMissingReleaseTag({ value }) {
  return !utils.getReleaseTag(value);
}

function addTagToComment({ value }) {
  const content = value.trim();
  if (content === emptyBlockComment || content === emptyLineComment) return `/** ${INTERNAL_TAG} */`;
  if (!/\n/.test(content)) return `/**\n ${content}\n * ${DEFAULT_TAG}\n */`;
  return `/*${content}\n * ${DEFAULT_TAG}\n */`;
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
        const comment = utils.getTSDocComment(context, node);

        if (comment && isMissingReleaseTag(comment)) {
          const variableName = utils.getExportName(node);
          context.report({
            loc: comment.loc,
            message: 'Missing release tag for {{ variableName }}',
            data: {
              variableName,
            },
            fix(fixer) {
              const value = addTagToComment(comment);
              return fixer.replaceTextRange(comment.range, value);
            },
          });
        }
      },
    };
  },
};
