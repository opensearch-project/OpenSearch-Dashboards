/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExpressionFunctionDefinition } from '../../../../../src/plugins/expressions/public';

interface Arguments {
  time: number;
}

export const sleep = (): ExpressionFunctionDefinition<'sleep', any, Arguments, any> => ({
  name: 'sleep',
  help: i18n.translate('expressionsExample.function.sleep.help', {
    defaultMessage: 'Generates range object',
  }),
  args: {
    time: {
      types: ['number'],
      help: i18n.translate('expressionsExample.function.sleep.time.help', {
        defaultMessage: 'Time for settimeout',
      }),
      required: false,
    },
  },
  fn: async (input, args, context) => {
    await new Promise((r) => setTimeout(r, args.time));
    return input;
  },
});
