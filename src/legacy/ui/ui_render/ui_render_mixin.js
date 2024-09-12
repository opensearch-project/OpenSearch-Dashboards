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

import { createHash } from 'crypto';
import Boom from '@hapi/boom';
import { i18n, i18nLoader } from '@osd/i18n';
import * as v7light from '@elastic/eui/dist/eui_theme_light.json';
import * as v7dark from '@elastic/eui/dist/eui_theme_dark.json';
import * as v8light from '@elastic/eui/dist/eui_theme_next_light.json';
import * as v8dark from '@elastic/eui/dist/eui_theme_next_dark.json';
import * as v9light from '@elastic/eui/dist/eui_theme_v9_light.json';
import * as v9dark from '@elastic/eui/dist/eui_theme_v9_dark.json';
import * as UiSharedDeps from '@osd/ui-shared-deps';
import { OpenSearchDashboardsRequest } from '../../../core/server';
import { AppBootstrap } from './bootstrap';
import { getApmConfig } from '../apm';

/**
 * @typedef {import('../../server/osd_server').default} OsdServer
 * @typedef {import('../../server/osd_server').ResponseToolkit} ResponseToolkit
 */

/**
 *
 * @param {OsdServer} osdServer
 * @param {OsdServer['server']} server
 * @param {OsdServer['config']} config
 */
export function uiRenderMixin(osdServer, server, config) {
  const translationsCache = { translations: null, hash: null };
  const defaultLocale = i18n.getLocale() || 'en'; // Fallback to 'en' if no default locale is set

  // Route handler for serving translation files.
  // This handler supports two scenarios:
  // 1. Serving translations for the default locale
  // 2. Serving translations for other registered locales
  server.route({
    path: '/translations/{locale}.json',
    method: 'GET',
    config: { auth: false },
    handler: async (request, h) => {
      const { locale } = request.params;
      const normalizedLocale = locale.toLowerCase();
      const registeredLocales = i18nLoader.getRegisteredLocales().map((l) => l.toLowerCase());
      let warning = null;

      // Function to get or create cached translations
      const getCachedTranslations = async (localeKey, getTranslationsFn) => {
        if (!translationsCache[localeKey]) {
          const translations = await getTranslationsFn();
          translationsCache[localeKey] = {
            translations: translations,
            hash: createHash('sha1').update(JSON.stringify(translations)).digest('hex'),
          };
        }
        return translationsCache[localeKey];
      };

      let cachedTranslations;

      if (normalizedLocale === defaultLocale.toLowerCase()) {
        // Default locale
        cachedTranslations = await getCachedTranslations(defaultLocale, () =>
          i18n.getTranslation()
        );
      } else if (registeredLocales.includes(normalizedLocale)) {
        // Other registered locales
        cachedTranslations = await getCachedTranslations(normalizedLocale, () =>
          i18nLoader.getTranslationsByLocale(locale)
        );
      } else {
        // Locale not found, fall back to en locale
        cachedTranslations = await getCachedTranslations('en', () =>
          i18nLoader.getTranslationsByLocale('en')
        );
        warning = {
          title: 'Unsupported Locale',
          text: `The requested locale "${locale}" is not supported. Falling back to English.`,
        };
      }

      const response = {
        translations: cachedTranslations.translations,
        warning,
      };

      return h
        .response(response)
        .header('cache-control', 'must-revalidate')
        .header('content-type', 'application/json')
        .etag(cachedTranslations.hash);
    },
  });

  const authEnabled = !!server.auth.settings.default;
  server.route({
    path: '/bootstrap.js',
    method: 'GET',
    config: {
      tags: ['api'],
      auth: authEnabled ? { mode: 'try' } : false,
    },
    async handler(_request, h) {
      const buildHash = server.newPlatform.env.packageInfo.buildNum;
      const basePath = config.get('server.basePath');

      const regularBundlePath = `${basePath}/${buildHash}/bundles`;

      const kpUiPlugins = osdServer.newPlatform.__internals.uiPlugins;
      const kpPluginPublicPaths = new Map();
      const kpPluginBundlePaths = new Set();

      // recursively iterate over the kpUiPlugin ids and their required bundles
      // to populate kpPluginPublicPaths and kpPluginBundlePaths
      (function readKpPlugins(ids) {
        for (const id of ids) {
          if (kpPluginPublicPaths.has(id)) {
            continue;
          }

          kpPluginPublicPaths.set(id, `${regularBundlePath}/plugin/${id}/`);
          kpPluginBundlePaths.add(`${regularBundlePath}/plugin/${id}/${id}.plugin.js`);
          readKpPlugins(kpUiPlugins.internal.get(id).requiredBundles);
        }
      })(kpUiPlugins.public.keys());

      const jsDependencyPaths = [
        ...UiSharedDeps.jsDepFilenames.map(
          (filename) => `${regularBundlePath}/osd-ui-shared-deps/${filename}`
        ),
        `${regularBundlePath}/osd-ui-shared-deps/${UiSharedDeps.jsFilename}`,

        `${regularBundlePath}/core/core.entry.js`,
        ...kpPluginBundlePaths,
      ];

      // These paths should align with the bundle routes configured in
      // src/optimize/bundles_route/bundles_route.ts
      const publicPathMap = JSON.stringify({
        core: `${regularBundlePath}/core/`,
        'osd-ui-shared-deps': `${regularBundlePath}/osd-ui-shared-deps/`,
        ...Object.fromEntries(kpPluginPublicPaths),
      });

      const bootstrap = new AppBootstrap({
        templateData: {
          jsDependencyPaths,
          publicPathMap,
          basePath,
          regularBundlePath,
          UiSharedDeps,
          THEME_CSS_DIST_FILENAMES: JSON.stringify(UiSharedDeps.themeCssDistFilenames),
          KUI_CSS_DIST_FILENAMES: JSON.stringify(UiSharedDeps.kuiCssDistFilenames),
        },
      });

      const body = await bootstrap.getJsFile();
      const etag = await bootstrap.getJsFileHash();

      return h
        .response(body)
        .header('cache-control', 'must-revalidate')
        .header('content-type', 'application/javascript')
        .etag(etag);
    },
  });

  server.route({
    path: '/startup.js',
    method: 'GET',
    config: {
      tags: ['api'],
      auth: authEnabled ? { mode: 'try' } : false,
    },
    async handler(request, h) {
      const soClient = osdServer.newPlatform.start.core.savedObjects.getScopedClient(
        OpenSearchDashboardsRequest.from(request)
      );
      const uiSettings = osdServer.newPlatform.start.core.uiSettings.asScopedToClient(soClient);

      // coerce to booleans just in case, to make sure template vars render correctly
      const configEnableUserControl =
        !authEnabled || request.auth.isAuthenticated
          ? !!(await uiSettings.get('theme:enableUserControl'))
          : !!uiSettings.getOverrideOrDefault('theme:enableUserControl');

      const configDarkMode =
        !authEnabled || request.auth.isAuthenticated
          ? !!(await uiSettings.get('theme:darkMode'))
          : !!uiSettings.getOverrideOrDefault('theme:darkMode');

      const configThemeVersion =
        !authEnabled || request.auth.isAuthenticated
          ? await uiSettings.get('theme:version')
          : uiSettings.getOverrideOrDefault('theme:version');

      const LOADING_SCREEN_THEME_VARS = [
        'euiColorDarkShade',
        'euiColorFullShade',
        'euiColorLightestShade',
        'euiColorPrimary',
        'euiHeaderBackgroundColor',
      ];
      const getLoadingVars = (allThemeVars) => {
        const filteredVars = {};
        LOADING_SCREEN_THEME_VARS.forEach((key) => (filteredVars[key] = allThemeVars[key]));
        return filteredVars;
      };
      const THEME_SOURCES = JSON.stringify({
        v7: {
          light: getLoadingVars(v7light),
          dark: getLoadingVars(v7dark),
        },
        v8: {
          light: getLoadingVars(v8light),
          dark: getLoadingVars(v8dark),
        },
        v9: {
          light: getLoadingVars(v9light),
          dark: getLoadingVars(v9dark),
        },
      });

      /*
       * The fonts are added as CSS variables, overriding OUI's, and then
       * the CSS variables are consumed.
       */
      const fontText = JSON.stringify({
        v7: 'Inter UI',
        v8: 'Source Sans 3',
        v9: 'Rubik',
      });

      const fontCode = JSON.stringify({
        v7: 'Roboto Mono',
        v8: 'Source Code Pro',
        v9: 'Fira Code',
      });

      const startup = new AppBootstrap(
        {
          templateData: {
            configEnableUserControl,
            configDarkMode,
            configThemeVersion,
            defaultThemeVersion:
              UiSharedDeps.themeVersionValueMap[uiSettings.getDefault('theme:version')],
            THEME_VERSION_VALUE_MAP: JSON.stringify(UiSharedDeps.themeVersionValueMap),
            THEME_SOURCES,
            fontText,
            fontCode,
          },
        },
        'startup'
      );

      const body = await startup.getJsFile();
      const etag = await startup.getJsFileHash();

      return h
        .response(body)
        .header('cache-control', 'must-revalidate')
        .header('content-type', 'application/javascript')
        .etag(etag);
    },
  });

  server.route({
    path: '/app/{id}/{any*}',
    method: 'GET',
    async handler(req, h) {
      try {
        return await h.renderApp();
      } catch (err) {
        throw Boom.boomify(err);
      }
    },
  });

  async function renderApp(h) {
    const { http } = osdServer.newPlatform.setup.core;
    const { savedObjects } = osdServer.newPlatform.start.core;
    const { rendering } = osdServer.newPlatform.__internals;
    const req = OpenSearchDashboardsRequest.from(h.request);
    const uiSettings = osdServer.newPlatform.start.core.uiSettings.asScopedToClient(
      savedObjects.getScopedClient(req)
    );
    const vars = {
      apmConfig: getApmConfig(h.request.path),
    };
    const content = await rendering.render(h.request, uiSettings, {
      includeUserSettings: true,
      vars,
    });

    return h.response(content).type('text/html').header('content-security-policy', http.csp.header);
  }

  server.decorate('toolkit', 'renderApp', function () {
    return renderApp(this);
  });
}
