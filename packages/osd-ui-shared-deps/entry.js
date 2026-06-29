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

require('./polyfills');

export const Jquery = require('jquery');
window.$ = window.jQuery = Jquery;
require('./flot_charts');

// stateful deps
export const OsdI18n = require('@osd/i18n');
export const OsdI18nReact = require('@osd/i18n/react');
export const Moment = require('moment');
export const MomentTimezone = require('moment-timezone/moment-timezone');
export const OsdMonaco = require('@osd/monaco');
export const MonacoBarePluginApi = require('@osd/monaco').BarePluginApi;
export const React = require('react');
export const ReactDom = require('react-dom');
export const ReactDomServer = require('react-dom/server');
export const ReactRouter = require('react-router'); // eslint-disable-line
export const ReactRouterDom = require('react-router-dom');
export const StyledComponents = require('styled-components');

Moment.tz.load(require('moment-timezone/data/packed/latest.json'));

// big deps which are locked to a single version
export const Rxjs = require('rxjs');
export const RxjsOperators = require('rxjs/operators');
export const ElasticNumeral = require('@elastic/numeral');
export const ElasticCharts = require('@elastic/charts');
export const ElasticEui = require('@elastic/eui');
export const ElasticEuiLibServices = require('@elastic/eui/lib/services');
export const ElasticEuiLibServicesFormat = require('@elastic/eui/lib/services/format');
export const ElasticEuiChartsTheme = require('@elastic/eui/dist/eui_charts_theme');
export const Theme = require('./theme.ts');
export const Lodash = require('lodash');
export const LodashFp = require('lodash/fp');

// runtime deps which don't need to be copied across all bundles
export const TsLib = require('tslib');

// Version metadata for the shared singletons, sourced from each package's
// authoritative package.json at build time. Module Federation's runtime
// compares the host-advertised version against each remote's required range;
// without this map the host's `readVersion` fallback labelled every singleton
// as "0.0.0" and the MF runtime emitted a noisy "Version 0.0.0 does not
// satisfy ..." warning per singleton per remote per page load (Issue 1).
//
// The keys mirror the canonical singletons in
// `packages/osd-mfe/src/bootstrap/share_scope.ts::SHARED_SINGLETONS`. The
// orchestrator's `buildShareScope` reads from this object first; subpath
// exports (RxjsOperators, ReactDomServer, OsdI18nReact, MonacoBarePluginApi,
// LodashFp, ElasticEuiLibServices, ElasticEuiChartsTheme, Theme) and CSS-only
// theme bundles are intentionally NOT in the map — they are not Module
// Federation singletons and share their parent package's identity.
export const __versions__ = Object.freeze({
  ElasticCharts: require('@elastic/charts/package.json').version,
  ElasticEui: require('@elastic/eui/package.json').version,
  ElasticNumeral: require('@elastic/numeral/package.json').version,
  Jquery: require('jquery/package.json').version,
  Lodash: require('lodash/package.json').version,
  Moment: require('moment/package.json').version,
  MomentTimezone: require('moment-timezone/package.json').version,
  OsdI18n: require('@osd/i18n/package.json').version,
  OsdMonaco: require('@osd/monaco/package.json').version,
  React: require('react/package.json').version,
  ReactDom: require('react-dom/package.json').version,
  ReactRouter: require('react-router/package.json').version, // eslint-disable-line @osd/eslint/module_migration
  ReactRouterDom: require('react-router-dom/package.json').version,
  Rxjs: require('rxjs/package.json').version,
  StyledComponents: require('styled-components/package.json').version,
  TsLib: require('tslib/package.json').version,
});
