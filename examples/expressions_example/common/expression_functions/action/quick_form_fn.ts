/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  Render,
} from '../../../../../src/plugins/expressions/public';
import { QuickFormRenderValue } from './quick_form_renderer';

type Arguments = QuickFormRenderValue;

export const quickFormFn = (): ExpressionFunctionDefinition<
  'quick-form',
  unknown,
  Arguments,
  Render<QuickFormRenderValue>
> => ({
  name: 'quick-form',
  type: 'render',
  help: i18n.translate('expressionsExample.function.avatar.help', {
    defaultMessage: 'Render a simple form that sends the value back as an event on click',
  }),
  args: {
    label: {
      types: ['string'],
      help: i18n.translate('expressionsExample.function.form.args.label.help', {
        defaultMessage: 'Form label',
      }),
      default: i18n.translate('expressionsExample.function.form.args.label.default', {
        defaultMessage: 'Input',
      }),
    },
    buttonLabel: {
      types: ['string'],
      help: i18n.translate('expressionsExample.function.form.args.buttonLabel.help', {
        defaultMessage: 'Button label',
      }),
      default: i18n.translate('expressionsExample.function.form.args.buttonLabel.default', {
        defaultMessage: 'Submit',
      }),
    },
  },
  fn: (input, args) => {
    return {
      type: 'render',
      as: 'quick-form-renderer',
      value: { ...args },
    };
  },
});
