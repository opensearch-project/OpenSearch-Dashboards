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
      name: i18n.translate('banner.ui_settings.params.visibleTitle', {
        defaultMessage: 'Banner visibility',
      }),
      value: true,
      type: 'boolean',
      description: i18n.translate('banner.ui_settings.params.visibleText', {
        defaultMessage: 'Controls whether the global banner is visible.',
      }),
      category: ['banner'],
      schema: schema.boolean(),
      requiresPageReload: true,
    },
    'banner:content': {
      name: i18n.translate('banner.ui_settings.params.contentTitle', {
        defaultMessage: 'Banner content',
      }),
      value: '',
      type: 'markdown',
      description: i18n.translate('banner.ui_settings.params.contentText', {
        defaultMessage:
          'Content for the global banner displayed at the top of the page. {markdownLink}.',
        description:
          'Part of composite text: banner.ui_settings.params.contentText + ' +
          'banner.ui_settings.params.content.markdownLinkText',
        values: {
          markdownLink:
            `<a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/"
            target="_blank" rel="noopener noreferrer">` +
            i18n.translate('banner.ui_settings.params.content.markdownLinkText', {
              defaultMessage: 'Markdown supported',
            }) +
            '</a>',
        },
      }),
      category: ['banner'],
      schema: schema.string(),
      requiresPageReload: true,
    },
    'banner:color': {
      name: i18n.translate('banner.ui_settings.params.colorTitle', {
        defaultMessage: 'Banner color',
      }),
      value: 'primary',
      type: 'select',
      options: ['primary', 'warning', 'danger'],
      description: i18n.translate('banner.ui_settings.params.colorText', {
        defaultMessage: 'Color scheme for the global banner.',
      }),
      category: ['banner'],
      schema: schema.oneOf([
        schema.literal('primary'),
        schema.literal('warning'),
        schema.literal('danger'),
      ]),
      requiresPageReload: true,
    },
    'banner:iconType': {
      name: i18n.translate('banner.ui_settings.params.iconTypeTitle', {
        defaultMessage: 'Banner icon',
      }),
      value: 'iInCircle',
      type: 'select',
      options: ['iInCircle', 'help', 'alert', 'warning', 'check', 'bell'],
      description: i18n.translate('banner.ui_settings.params.iconTypeText', {
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
      requiresPageReload: true,
    },
    'banner:useMarkdown': {
      name: i18n.translate('banner.ui_settings.params.useMarkdownTitle', {
        defaultMessage: 'Use markdown in banner',
      }),
      value: true,
      type: 'boolean',
      description: i18n.translate('banner.ui_settings.params.useMarkdownText', {
        defaultMessage: 'Controls whether markdown is rendered in the banner content.',
      }),
      category: ['banner'],
      schema: schema.boolean(),
      requiresPageReload: true,
    },
  };
};
