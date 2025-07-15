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

import { schema } from '@osd/config-schema';
import { i18n } from '@osd/i18n';
import { UiSettingsParams } from 'opensearch-dashboards/server';

export const getBannerSettings = (): Record<string, UiSettingsParams> => {
  return {
    'banner:active': {
      name: i18n.translate('core.ui_settings.params.banner.visibleTitle', {
        defaultMessage: 'Banner visibility',
      }),
      value: true,
      type: 'boolean',
      description: i18n.translate('core.ui_settings.params.banner.visibleText', {
        defaultMessage: 'Controls whether the global banner is visible.',
      }),
      category: ['banner'],
      schema: schema.boolean(),
    },
    'banner:content': {
      name: i18n.translate('core.ui_settings.params.banner.contentTitle', {
        defaultMessage: 'Banner content',
      }),
      value: '',
      type: 'markdown',
      description: i18n.translate('core.ui_settings.params.banner.contentText', {
        defaultMessage:
          'Content for the global banner displayed at the top of the page. {markdownLink}.',
        description:
          'Part of composite text: core.ui_settings.params.banner.contentText + ' +
          'core.ui_settings.params.banner.content.markdownLinkText',
        values: {
          markdownLink:
            `<a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/"
            target="_blank" rel="noopener noreferrer">` +
            i18n.translate('core.ui_settings.params.banner.content.markdownLinkText', {
              defaultMessage: 'Markdown supported',
            }) +
            '</a>',
        },
      }),
      category: ['banner'],
      schema: schema.string(),
    },
    'banner:color': {
      name: i18n.translate('core.ui_settings.params.banner.colorTitle', {
        defaultMessage: 'Banner color',
      }),
      value: 'primary',
      type: 'select',
      options: ['primary', 'warning', 'danger'],
      description: i18n.translate('core.ui_settings.params.banner.colorText', {
        defaultMessage: 'Color scheme for the global banner.',
      }),
      category: ['banner'],
      schema: schema.oneOf([
        schema.literal('primary'),
        schema.literal('warning'),
        schema.literal('danger'),
      ]),
    },
    'banner:iconType': {
      name: i18n.translate('core.ui_settings.params.banner.iconTypeTitle', {
        defaultMessage: 'Banner icon',
      }),
      value: 'iInCircle',
      type: 'select',
      options: ['iInCircle', 'help', 'alert', 'warning', 'check', 'bell'],
      description: i18n.translate('core.ui_settings.params.banner.iconTypeText', {
        defaultMessage: 'Icon to display in the global banner.',
      }),
      category: ['banner'],
      schema: schema.oneOf([
        schema.literal('iInCircle'),
        schema.literal('help'),
        schema.literal('alert'),
        schema.literal('warning'),
        schema.literal('bell'),
      ]),
    },
    'banner:useMarkdown': {
      name: i18n.translate('core.ui_settings.params.banner.useMarkdownTitle', {
        defaultMessage: 'Use markdown in banner',
      }),
      value: true,
      type: 'boolean',
      description: i18n.translate('core.ui_settings.params.banner.useMarkdownText', {
        defaultMessage: 'Controls whether markdown is rendered in the banner content.',
      }),
      category: ['banner'],
      schema: schema.boolean(),
    },
  };
};
