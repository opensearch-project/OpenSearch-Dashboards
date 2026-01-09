/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow usage of mathjs library',
      category: 'Best Practices',
      recommended: false,
    },
    messages: {
      noMathjs: 'Usage of "mathjs" library is not allowed. Please use an alternative.',
      noMathjsImport: 'Importing from "mathjs" is not allowed. Please use an alternative.',
      noMathjsRequire: 'Requiring "mathjs" is not allowed. Please use an alternative.',
    },
    schema: [], // no options
  },

  create(context) {
    return {
      // Block ES6 imports: import ... from 'mathjs'
      ImportDeclaration(node) {
        if (node.source.value === 'mathjs') {
          context.report({
            node,
            messageId: 'noMathjsImport',
          });
        }
      },

      // Block CommonJS require: require('mathjs')
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal' &&
          node.arguments[0].value === 'mathjs'
        ) {
          context.report({
            node,
            messageId: 'noMathjsRequire',
          });
        }
      },

      // Block dynamic imports: import('mathjs')
      ImportExpression(node) {
        if (node.source.type === 'Literal' && node.source.value === 'mathjs') {
          context.report({
            node,
            messageId: 'noMathjs',
          });
        }
      },
    };
  },
};
