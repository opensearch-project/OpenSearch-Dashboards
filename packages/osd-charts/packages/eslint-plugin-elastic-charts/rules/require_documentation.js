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

const { INTERNAL_TAG } = require('./constants');
const utils = require('./utils');

function isUndocumented({ value }) {
  const tag = utils.getReleaseTag(value);
  if (!tag || tag === INTERNAL_TAG) return false;
  return value.replace(tag, '').replace(/\*/g, '').trim() === '';
}

module.exports = {
  meta: {
    type: 'problem',
  },
  create(context) {
    return {
      // eslint-disable-next-line func-names
      'ExportNamedDeclaration[specifiers=""]:not(ExportAllDeclaration)': function (node) {
        const comment = utils.getTSDocComment(context, node);

        if (comment && isUndocumented(comment)) {
          const variableName = utils.getExportName(node);
          context.report({
            loc: comment.loc,
            message: '{{ variableName }} is undocumented',
            data: {
              variableName,
            },
          });
        }
      },
    };
  },
};
