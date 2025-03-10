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

import Color from 'color';

import { monaco } from '@osd/monaco';

import darkTheme from '@elastic/eui/dist/eui_theme_dark.json';
import lightTheme from '@elastic/eui/dist/eui_theme_light.json';

// NOTE: For talk around where this theme information will ultimately live,
// please see this discuss issue: https://github.com/elastic/kibana/issues/43814
const standardizeColor = (color: string) => new Color(color).hex().toLowerCase();

export function createTheme(
  euiTheme: typeof darkTheme | typeof lightTheme,
  selectionBackgroundColor: string
): monaco.editor.IStandaloneThemeData {
  return {
    base: 'vs',
    inherit: true,
    rules: [
      {
        token: '',
        foreground: standardizeColor(euiTheme.euiColorDarkestShade),
        background: standardizeColor(euiTheme.euiColorEmptyShade),
      },
      { token: 'invalid', foreground: standardizeColor(euiTheme.euiColorAccent) },
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'strong', fontStyle: 'bold' },

      { token: 'variable', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'variable.predefined', foreground: standardizeColor(euiTheme.euiColorSecondary) },
      { token: 'constant', foreground: standardizeColor(euiTheme.euiColorAccent) },
      { token: 'comment', foreground: standardizeColor(euiTheme.euiColorMediumShade) },
      { token: 'number', foreground: standardizeColor(euiTheme.euiColorAccent) },
      { token: 'number.hex', foreground: standardizeColor(euiTheme.euiColorAccent) },
      { token: 'regexp', foreground: standardizeColor(euiTheme.euiColorDanger) },
      { token: 'annotation', foreground: standardizeColor(euiTheme.euiColorMediumShade) },
      { token: 'type', foreground: standardizeColor(euiTheme.euiColorVis0) },

      { token: 'delimiter', foreground: standardizeColor(euiTheme.euiColorDarkestShade) },
      { token: 'delimiter.html', foreground: standardizeColor(euiTheme.euiColorDarkShade) },
      { token: 'delimiter.xml', foreground: standardizeColor(euiTheme.euiColorPrimary) },

      { token: 'tag', foreground: standardizeColor(euiTheme.euiColorDanger) },
      { token: 'tag.id.jade', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'tag.class.jade', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'meta.scss', foreground: standardizeColor(euiTheme.euiColorAccent) },
      { token: 'metatag', foreground: standardizeColor(euiTheme.euiColorSecondary) },
      { token: 'metatag.content.html', foreground: standardizeColor(euiTheme.euiColorDanger) },
      { token: 'metatag.html', foreground: standardizeColor(euiTheme.euiColorMediumShade) },
      { token: 'metatag.xml', foreground: standardizeColor(euiTheme.euiColorMediumShade) },
      { token: 'metatag.php', fontStyle: 'bold' },

      { token: 'key', foreground: standardizeColor(euiTheme.euiColorWarning) },
      { token: 'string.key.json', foreground: standardizeColor(euiTheme.euiColorDanger) },
      { token: 'string.value.json', foreground: standardizeColor(euiTheme.euiColorPrimary) },

      { token: 'attribute.name', foreground: standardizeColor(euiTheme.euiColorDanger) },
      { token: 'attribute.name.css', foreground: standardizeColor(euiTheme.euiColorSecondary) },
      { token: 'attribute.value', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'attribute.value.number', foreground: standardizeColor(euiTheme.euiColorWarning) },
      { token: 'attribute.value.unit', foreground: standardizeColor(euiTheme.euiColorWarning) },
      { token: 'attribute.value.html', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'attribute.value.xml', foreground: standardizeColor(euiTheme.euiColorPrimary) },

      { token: 'string', foreground: standardizeColor(euiTheme.euiColorDanger) },
      { token: 'string.html', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'string.sql', foreground: standardizeColor(euiTheme.euiColorDanger) },
      { token: 'string.yaml', foreground: standardizeColor(euiTheme.euiColorPrimary) },

      { token: 'keyword', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'keyword.json', foreground: standardizeColor(euiTheme.euiColorPrimary) },
      { token: 'keyword.flow', foreground: standardizeColor(euiTheme.euiColorWarning) },
      { token: 'keyword.flow.scss', foreground: standardizeColor(euiTheme.euiColorPrimary) },

      { token: 'operator.scss', foreground: standardizeColor(euiTheme.euiColorDarkShade) },
      { token: 'operator.sql', foreground: standardizeColor(euiTheme.euiColorMediumShade) },
      { token: 'operator.swift', foreground: standardizeColor(euiTheme.euiColorMediumShade) },
      { token: 'predefined.sql', foreground: standardizeColor(euiTheme.euiColorMediumShade) },
    ],
    colors: {
      'editor.foreground': standardizeColor(euiTheme.euiColorDarkestShade),
      'editor.background': standardizeColor(euiTheme.euiColorEmptyShade),
      'editorLineNumber.foreground': standardizeColor(euiTheme.euiColorDarkShade),
      'editorLineNumber.activeForeground': standardizeColor(euiTheme.euiColorDarkShade),
      'editorIndentGuide.background': standardizeColor(euiTheme.euiColorLightShade),
      'editor.selectionBackground': standardizeColor(selectionBackgroundColor),
      'editorWidget.border': standardizeColor(euiTheme.euiColorLightShade),
      'editorWidget.background': standardizeColor(euiTheme.euiColorLightestShade),
      'editorCursor.foreground': standardizeColor(euiTheme.euiColorDarkestShade),
      'editorSuggestWidget.selectedBackground': standardizeColor(euiTheme.euiColorLightShade),
      'list.hoverBackground': standardizeColor(euiTheme.euiColorLightShade),
      'list.highlightForeground': standardizeColor(euiTheme.euiColorPrimary),
      'editor.lineHighlightBorder': standardizeColor(euiTheme.euiColorLightestShade),
    },
  };
}

// TODO: Refactor to use packages/osd-ui-shared-deps/theme.ts: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5661
const DARK_THEME = createTheme(darkTheme, '#343551');
const LIGHT_THEME = createTheme(lightTheme, '#E3E4ED');

export { DARK_THEME, LIGHT_THEME };
