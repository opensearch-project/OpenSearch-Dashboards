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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { schema } from '@osd/config-schema';
import { i18n } from '@osd/i18n';
import { themeVersionLabelMap } from '@osd/ui-shared-deps';
import type { Type } from '@osd/config-schema';
import { UiSettingsParams } from '../../../types';
import { DEFAULT_THEME_VERSION } from '../ui_settings_config';

// Setup theme options to be backwards compatible with the fact that v8 was persisted with its
// label rather than with the correct themeVersion value
const THEME_VERSIONS = Object.keys(themeVersionLabelMap);
const THEME_SCHEMA_VALUES = THEME_VERSIONS.concat(themeVersionLabelMap.v8);
const THEME_OPTIONS = THEME_VERSIONS.map((v) => (v !== 'v8' ? v : themeVersionLabelMap.v8));

export const getThemeSettings = (): Record<string, UiSettingsParams> => {
  return {
    'theme:enableUserControl': {
      name: i18n.translate('core.ui_settings.params.enableUserControlTitle', {
        defaultMessage: 'Enable user control',
      }),
      value: false,
      description: i18n.translate('core.ui_settings.params.enableUserControlText', {
        defaultMessage: `Enable users to control theming and dark or light mode via "Appearance" control in top navigation. When true, those settings can no longer be set globally by administrators.`,
      }),
      requiresPageReload: true,
      category: ['appearance'],
      schema: schema.boolean(),
      type: 'boolean',
    },
    'theme:darkMode': {
      name: i18n.translate('core.ui_settings.params.darkModeTitle', {
        defaultMessage: 'Dark mode',
      }),
      value: false,
      description: i18n.translate('core.ui_settings.params.darkModeText', {
        defaultMessage: `Enable a dark mode for the OpenSearch Dashboards UI. A page refresh is required for the setting to be applied.`,
      }),
      requiresPageReload: true,
      preferBrowserSetting: true,
      category: ['appearance'],
      schema: schema.boolean(),
      type: 'boolean',
    },
    'theme:version': {
      name: i18n.translate('core.ui_settings.params.themeVersionTitle', {
        defaultMessage: 'Theme version',
      }),
      value:
        DEFAULT_THEME_VERSION === 'v8'
          ? themeVersionLabelMap[DEFAULT_THEME_VERSION]
          : DEFAULT_THEME_VERSION,
      type: 'select',
      options: THEME_OPTIONS,
      optionLabels: themeVersionLabelMap,
      description: i18n.translate('core.ui_settings.params.themeVersionText', {
        defaultMessage: `<p>Switch between the themes used for the current and next versions of OpenSearch Dashboards. A page refresh is required for the setting to be applied.</p><p><a href="{href}">{linkText}</a></p>`,
        values: {
          href: 'https://forum.opensearch.org/t/feedback-on-dark-mode-experience/15725',
          linkText: 'Theme feedback',
        },
      }),
      requiresPageReload: true,
      preferBrowserSetting: true,
      category: ['appearance'],
      schema: schema.oneOf(THEME_SCHEMA_VALUES.map((v) => schema.literal(v)) as [Type<string>]),
    },
  };
};
