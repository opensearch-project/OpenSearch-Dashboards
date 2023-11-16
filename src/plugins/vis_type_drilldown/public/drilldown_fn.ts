/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExpressionFunctionDefinition, Render } from '../../expressions/public';
import { DrilldownVisParams } from './types';
import { Arguments } from '../../vis_type_markdown/public/types';

export interface DrilldownVisRenderValue {
  visType: 'markdown';
  visParams: DrilldownVisParams;
}

export type DrilldownVisExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'markdownVis',
  unknown,
  Arguments,
  Render<DrilldownVisRenderValue>
>;

export const createMarkdownVisFn = (): DrilldownVisExpressionFunctionDefinition => ({
  name: 'markdownVis',
  type: 'render',
  inputTypes: [],
  help: i18n.translate('visTypeMarkdown.function.help', {
    defaultMessage: 'Markdown visualization',
  }),
  args: {
    markdown: {
      types: ['string'],
      aliases: ['_'],
      required: true,
      help: i18n.translate('visTypeMarkdown.function.markdown.help', {
        defaultMessage: 'Markdown to render',
      }),
    },
    font: {
      types: ['style'],
      help: i18n.translate('visTypeMarkdown.function.font.help', {
        defaultMessage: 'Font settings.',
      }),
      default: `{font size=12}`,
    },
    openLinksInNewTab: {
      types: ['boolean'],
      default: false,
      help: i18n.translate('visTypeMarkdown.function.openLinksInNewTab.help', {
        defaultMessage: 'Opens links in new tab',
      }),
    },
  },
  fn(input, args) {
    return {
      type: 'render',
      as: 'markdown_vis',
      value: {
        visType: 'markdown',
        visParams: {
          markdown: args.markdown,
          openLinksInNewTab: args.openLinksInNewTab,
          fontSize: parseInt(args.font.spec.fontSize || '12', 10),
        },
      },
    };
  },
});
