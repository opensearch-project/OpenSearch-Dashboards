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

const Path = require('path');

exports.distDir = Path.resolve(__dirname, 'target');
exports.jsDepFilenames = ['osd-ui-shared-deps.@elastic.js'];
exports.jsFilename = 'osd-ui-shared-deps.js';
exports.baseCssDistFilename = 'osd-ui-shared-deps.css';
exports.lightCssDistFilename = 'osd-ui-shared-deps.v7.light.css';
exports.lightV8CssDistFilename = 'osd-ui-shared-deps.v8.light.css';
exports.darkCssDistFilename = 'osd-ui-shared-deps.v7.dark.css';
exports.darkV8CssDistFilename = 'osd-ui-shared-deps.v8.dark.css';
exports.externals = {
  // stateful deps
  '@osd/i18n': '__osdSharedDeps__.OsdI18n',
  '@osd/i18n/react': '__osdSharedDeps__.OsdI18nReact',
  jquery: '__osdSharedDeps__.Jquery',
  moment: '__osdSharedDeps__.Moment',
  'moment-timezone': '__osdSharedDeps__.MomentTimezone',
  react: '__osdSharedDeps__.React',
  'react-dom': '__osdSharedDeps__.ReactDom',
  'react-dom/server': '__osdSharedDeps__.ReactDomServer',
  'react-router': '__osdSharedDeps__.ReactRouter',
  'react-router-dom': '__osdSharedDeps__.ReactRouterDom',
  'styled-components': '__osdSharedDeps__.StyledComponents',
  '@osd/monaco': '__osdSharedDeps__.OsdMonaco',
  '@osd/ui-shared-deps/theme': '__osdSharedDeps__.Theme',
  // this is how plugins/consumers from npm load monaco
  'monaco-editor/esm/vs/editor/editor.api': '__osdSharedDeps__.MonacoBarePluginApi',

  /**
   * big deps which are locked to a single version
   */
  rxjs: '__osdSharedDeps__.Rxjs',
  'rxjs/operators': '__osdSharedDeps__.RxjsOperators',
  numeral: '__osdSharedDeps__.ElasticNumeral',
  '@elastic/numeral': '__osdSharedDeps__.ElasticNumeral',
  '@elastic/charts': '__osdSharedDeps__.ElasticCharts',
  '@elastic/eui': '__osdSharedDeps__.ElasticEui',
  '@elastic/eui/lib/services': '__osdSharedDeps__.ElasticEuiLibServices',
  '@elastic/eui/lib/services/format': '__osdSharedDeps__.ElasticEuiLibServicesFormat',
  '@elastic/eui/dist/eui_charts_theme': '__osdSharedDeps__.ElasticEuiChartsTheme',
  '@elastic/eui/dist/eui_theme_light.json': '__osdSharedDeps__.Theme.euiLightVars',
  '@elastic/eui/dist/eui_theme_dark.json': '__osdSharedDeps__.Theme.euiDarkVars',
  lodash: '__osdSharedDeps__.Lodash',
  'lodash/fp': '__osdSharedDeps__.LodashFp',

  /**
   * runtime deps which don't need to be copied across all bundles
   */
  tslib: '__osdSharedDeps__.TsLib',
};
exports.publicPathLoader = require.resolve('./public_path_loader');
