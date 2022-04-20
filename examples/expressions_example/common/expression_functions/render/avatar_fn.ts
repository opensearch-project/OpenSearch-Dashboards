/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  Render,
} from '../../../../../src/plugins/expressions/public';
import { AvatarRenderValue } from './avatar_renderer';

type Arguments = AvatarRenderValue;

export const avatarFn = (): ExpressionFunctionDefinition<
  'avatar',
  unknown,
  Arguments,
  Render<AvatarRenderValue>
> => ({
  name: 'avatar',
  type: 'render',
  help: i18n.translate('expressionsExample.function.avatar.help', {
    defaultMessage: 'Avatar expression function',
  }),
  args: {
    name: {
      types: ['string'],
      help: i18n.translate('expressionsExample.function.avatar.args.name.help', {
        defaultMessage: 'Enter Name',
      }),
      required: true,
    },
    size: {
      types: ['string'],
      help: i18n.translate('expressionsExample.function.avatar.args.size.help', {
        defaultMessage: 'Size of the avatar',
      }),
      default: 'l',
    },
  },
  fn: (input, args) => {
    return {
      type: 'render',
      as: 'avatar',
      value: {
        name: args.name,
        size: args.size,
      },
    };
  },
});
