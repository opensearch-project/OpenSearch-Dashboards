/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExpressionFunctionDefinition } from '../../../../../src/plugins/expressions/public';

export const square = (): ExpressionFunctionDefinition<'square', number, {}, any> => ({
  name: 'square',
  help: i18n.translate('expressionsExample.function.square.help', {
    defaultMessage: 'Squares the input',
  }),
  args: {},
  fn: async (input, args, context) => {
    return input * input;
  },
});
