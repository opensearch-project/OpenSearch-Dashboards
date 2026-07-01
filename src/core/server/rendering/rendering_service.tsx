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

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { first, take } from 'rxjs/operators';
import { i18n, i18nLoader } from '@osd/i18n';
import { Agent as HttpsAgent } from 'https';

import Axios from 'axios';

import { UiPlugins } from '../plugins';
import { CoreContext } from '../core_context';
import { Template } from './views';
import {
  IRenderOptions,
  RenderingSetupDeps,
  InternalRenderingServiceSetup,
  RenderingMetadata,
  BrandingValidation,
  BrandingAssignment,
} from './types';
import { OpenSearchDashboardsConfigType } from '../opensearch_dashboards_config';
import { HttpConfigType } from '../http/http_config';
import { SslConfig } from '../http/ssl_config';
import { LoggerFactory } from '../logging';
import { resolveAllowOverride } from '../utils/resolve_allow_override';
import { readMfeBootManifest } from '../utils/mfe_boot_manifest';

const DEFAULT_TITLE = 'OpenSearch Dashboards';

/** @internal */
export class RenderingService {
  constructor(private readonly coreContext: CoreContext) {
    this.logger = this.coreContext.logger;
  }
  private logger: LoggerFactory;
  private httpsAgent?: HttpsAgent;

  public async setup({
    http,
    status,
    uiPlugins,
    dynamicConfig,
  }: RenderingSetupDeps): Promise<InternalRenderingServiceSetup> {
    const [opensearchDashboardsConfig, serverConfig] = await Promise.all([
      this.coreContext.configService
        .atPath<OpenSearchDashboardsConfigType>('opensearchDashboards')
        .pipe(first())
        .toPromise(),
      this.coreContext.configService.atPath<HttpConfigType>('server').pipe(first()).toPromise(),
    ]);

    this.setupHttpAgent(serverConfig as HttpConfigType);

    return {
      render: async (
        request,
        uiSettings,
        { includeUserSettings = true, vars, nonce }: IRenderOptions
      ) => {
        const env = {
          mode: this.coreContext.env.mode,
          packageInfo: this.coreContext.env.packageInfo,
        };
        const basePath = http.basePath.get(request);
        const uiPublicUrl = `${basePath}/ui`;
        const serverBasePath = http.basePath.serverBasePath;
        const settings = {
          defaults: uiSettings.getRegistered(),
          user: includeUserSettings ? await uiSettings.getUserProvided() : {},
        };

        const brandingAssignment = await this.assignBrandingConfig(
          opensearchDashboardsConfig as OpenSearchDashboardsConfigType
        );

        let locale = i18n.getLocale();
        const localeOverride = (request.query as any)?.locale?.trim?.();
        if (localeOverride) {
          const normalizedLocale = i18n.normalizeLocale(localeOverride);
          if (i18nLoader.isRegisteredLocale(normalizedLocale)) {
            locale = normalizedLocale;
          }
        }

        const dynamicConfigStartServices = await dynamicConfig.getStartService();

        // Phase 16 Story 6: project the v3 registry's `themes` field into a
        // per-theme `{ url, integrity? }` map for the HTML head's
        // `<meta name="osd-mfe-themes">` injection. Gated on `mfe.enabled`
        // AND on a configured `mfe.registryPath` AND on the resolved doc
        // actually advertising `themes` — any miss leaves `mfeThemes`
        // undefined, which omits the field from injectedMetadata.mfe ⇒ the
        // META isn't emitted ⇒ the legacy `/ui/legacy_<name>_theme.css`
        // same-origin path is preserved verbatim. Themes are GLOBAL in v3
        // (see schema_v3.ts §"Why GLOBAL, not per-layer"), so fixed
        // dimensions are sound (the cookie-derived userBucket is NOT used
        // by this projection — the resolver returns the same `themes`
        // object regardless). On a parse error we fail SOFT — the legacy
        // route still serves; the operator gets a clear log line.
        let mfeThemes: Record<string, { url: string; integrity?: string }> | undefined;
        if (opensearchDashboardsConfig.mfe.enabled) {
          const registryPath = opensearchDashboardsConfig.mfe.registryPath;
          if (registryPath && typeof registryPath === 'string') {
            try {
              const resolved = readMfeBootManifest(registryPath, {
                customerId: 'default',
                userBucket: 0,
              });
              if (resolved.themes) {
                mfeThemes = resolved.themes;
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error(
                `[mfe] rendering_service: failed to read/resolve registry at ${registryPath}; ` +
                  `omitting injectedMetadata.mfe.themes (legacy /ui/legacy_<name>_theme.css ` +
                  `path will serve instead). Cause: ${(err && (err as Error).message) || err}`
              );
            }
          }
        }

        const metadata: RenderingMetadata = {
          strictCsp: http.csp.strict,
          uiPublicUrl,
          bootstrapScriptUrl: `${basePath}/bootstrap.js`,
          startupScriptUrl: `${basePath}/startup.js`,
          i18n: i18n.translate,
          locale,
          nonce,
          injectedMetadata: {
            version: env.packageInfo.version,
            buildNumber: env.packageInfo.buildNum,
            branch: env.packageInfo.branch,
            basePath,
            serverBasePath,
            env,
            anonymousStatusPage: status.isStatusPageAnonymous(),
            i18n: {
              translationsUrl: `${basePath}/translations/${locale}.json`,
            },
            csp: { warnLegacyBrowsers: http.csp.warnLegacyBrowsers },
            vars: vars ?? {},
            uiPlugins: await Promise.all(
              [...uiPlugins.public].map(async ([id, plugin]) => ({
                id,
                plugin,
                // TODO Scope the client so that only exposedToBrowser configs are exposed
                config: this.coreContext.dynamicConfigService.hasDefaultConfigs({ name: id })
                  ? await dynamicConfigStartServices.getClient().getConfig(
                      { name: id },
                      {
                        asyncLocalStorageContext: dynamicConfigStartServices.getAsyncLocalStore()!,
                      }
                    )
                  : await this.getUiConfig(uiPlugins, id),
              }))
            ),
            legacyMetadata: {
              uiSettings: settings,
            },
            branding: {
              assetFolderUrl: `${uiPublicUrl}/default_branding`,
              logo: {
                defaultUrl: brandingAssignment.logoDefault,
                darkModeUrl: brandingAssignment.logoDarkmode,
              },
              mark: {
                defaultUrl: brandingAssignment.markDefault,
                darkModeUrl: brandingAssignment.markDarkmode,
              },
              loadingLogo: {
                defaultUrl: brandingAssignment.loadingLogoDefault,
                darkModeUrl: brandingAssignment.loadingLogoDarkmode,
              },
              faviconUrl: brandingAssignment.favicon,
              applicationTitle: brandingAssignment.applicationTitle,
              useExpandedHeader: brandingAssignment.useExpandedHeader,
            },
            survey: opensearchDashboardsConfig.survey.url,
            keyboardShortcuts: {
              enabled: opensearchDashboardsConfig.keyboardShortcuts.enabled,
            },
            // MFE mode (Phase 3): only when enabled do we add the `mfe` key, so the
            // serialized injected metadata for the default (non-MFE) path is
            // byte-for-byte unchanged. The browser MFE bootstrap reads these to load
            // plugin remotes from the origin instead of local plugin scripts.
            ...(opensearchDashboardsConfig.mfe.enabled
              ? {
                  mfe: {
                    registryUrl: opensearchDashboardsConfig.mfe.registryUrl,
                    sharedDepsUrl: opensearchDashboardsConfig.mfe.sharedDepsUrl,
                    // Non-prod security gate (Phase 5, §7): an explicit
                    // `mfe.allowOverride` wins, else default to dev mode (dev =>
                    // true, prod => false). The dev-only inspector reads this to
                    // decide whether to mount. Uses the shared core
                    // resolveAllowOverride() helper (mirrors @osd/mfe, which is
                    // not a dependency of src/).
                    allowOverride: resolveAllowOverride(
                      opensearchDashboardsConfig.mfe.allowOverride,
                      !!env.mode.dev
                    ),
                    // Phase 16 Story 6: project the v3 registry's `themes`
                    // map into the injected metadata so `template.tsx` can
                    // emit `<meta name="osd-mfe-themes">` in the HTML head.
                    // The same FAIL-SOFT contract as Story 5's bundle-route
                    // refuser applies: if the registry can't be read or
                    // doesn't advertise themes, the field is OMITTED, the
                    // META isn't emitted, and the legacy
                    // `/ui/legacy_<name>_theme.css` same-origin path is
                    // preserved — byte-for-byte backward-compat. The mtime
                    // cache in `mfe_boot_manifest.ts` makes the read O(1)
                    // for cache hits, so the per-render cost is a stat()
                    // of the registry file plus a map lookup. Themes are
                    // GLOBAL in v3 (see schema_v3.ts §"Why GLOBAL, not
                    // per-layer"), so fixed dimensions are sound.
                    ...(mfeThemes !== undefined ? { themes: mfeThemes } : {}),
                  },
                }
              : {}),
          },
        };

        return `<!DOCTYPE html>${renderToStaticMarkup(<Template metadata={metadata} />)}`;
      },
    };
  }

  public async stop() {}

  /**
   * Setups HTTP Agent if SSL is enabled to pass SSL config
   * values to Axios to make requests in while validating
   * resources.
   *
   * @param {Readonly<HttpConfigType>} httpConfig
   */
  private setupHttpAgent(httpConfig: Readonly<HttpConfigType>) {
    if (!httpConfig.ssl?.enabled) return;
    try {
      const sslConfig = new SslConfig(httpConfig.ssl);
      this.httpsAgent = new HttpsAgent({
        ca: sslConfig.certificateAuthorities,
        cert: sslConfig.certificate,
        key: sslConfig.key,
        passphrase: sslConfig.keyPassphrase,
        rejectUnauthorized: false,
      });
    } catch (e) {
      this.logger.get('branding').error('HTTP agent failed to setup for SSL.');
    }
  }

  /**
   * Assign values for branding related configurations based on branding validation
   * by calling checkBrandingValid(). If URL is valid, pass in
   * the actual URL; if not, pass in undefined.
   *
   * @param {Readonly<OpenSearchDashboardsConfigType>} opensearchDashboardsConfig
   * @returns {BrandingAssignment} valid URLs or undefined assigned for each branding configs
   */
  private assignBrandingConfig = async (
    opensearchDashboardsConfig: Readonly<OpenSearchDashboardsConfigType>
  ): Promise<BrandingAssignment> => {
    const brandingValidation: BrandingValidation = await this.checkBrandingValid(
      opensearchDashboardsConfig
    );
    const branding = opensearchDashboardsConfig.branding;

    // assign default mode URL based on the brandingValidation function result
    const logoDefault = brandingValidation.isLogoDefaultValid
      ? branding.logo.defaultUrl
      : undefined;

    const markDefault = brandingValidation.isMarkDefaultValid
      ? branding.mark.defaultUrl
      : undefined;

    const loadingLogoDefault = brandingValidation.isLoadingLogoDefaultValid
      ? branding.loadingLogo.defaultUrl
      : undefined;

    // assign dark mode URLs based on brandingValidation function result
    const logoDarkmode = brandingValidation.isLogoDarkmodeValid
      ? branding.logo.darkModeUrl
      : undefined;

    const markDarkmode = brandingValidation.isMarkDarkmodeValid
      ? branding.mark.darkModeUrl
      : undefined;

    const loadingLogoDarkmode = brandingValidation.isLoadingLogoDarkmodeValid
      ? branding.loadingLogo.darkModeUrl
      : undefined;

    // assign favicon based on brandingValidation function result
    const favicon = brandingValidation.isFaviconValid ? branding.faviconUrl : undefined;

    // assign application title based on brandingValidation function result
    const applicationTitle = brandingValidation.isTitleValid
      ? branding.applicationTitle
      : DEFAULT_TITLE;

    // use expanded menu by default unless explicitly set to false
    const { useExpandedHeader = true } = branding;

    const brandingAssignment: BrandingAssignment = {
      logoDefault,
      logoDarkmode,
      markDefault,
      markDarkmode,
      loadingLogoDefault,
      loadingLogoDarkmode,
      favicon,
      applicationTitle,
      useExpandedHeader,
    };

    return brandingAssignment;
  };

  /**
   * Assign boolean values for branding related configurations to indicate if
   * user inputs valid or invalid URLs by calling isUrlValid() function. Also
   * check if title is valid by calling isTitleValid() function.
   *
   * @param {Readonly<OpenSearchDashboardsConfigType>} opensearchDashboardsConfig
   * @returns {BrandingValidation} indicate valid/invalid URL for each branding config
   */
  private checkBrandingValid = async (
    opensearchDashboardsConfig: Readonly<OpenSearchDashboardsConfigType>
  ): Promise<BrandingValidation> => {
    const branding = opensearchDashboardsConfig.branding;
    const isLogoDefaultValid = await this.isUrlValid(branding.logo.defaultUrl, 'logo default');

    const isLogoDarkmodeValid = await this.isUrlValid(branding.logo.darkModeUrl, 'logo darkMode');

    const isMarkDefaultValid = await this.isUrlValid(branding.mark.defaultUrl, 'mark default');

    const isMarkDarkmodeValid = await this.isUrlValid(branding.mark.darkModeUrl, 'mark darkMode');

    const isLoadingLogoDefaultValid = await this.isUrlValid(
      branding.loadingLogo.defaultUrl,
      'loadingLogo default'
    );

    const isLoadingLogoDarkmodeValid = await this.isUrlValid(
      branding.loadingLogo.darkModeUrl,
      'loadingLogo darkMode'
    );

    const isFaviconValid = await this.isUrlValid(branding.faviconUrl, 'favicon');

    const isTitleValid = this.isTitleValid(branding.applicationTitle, 'applicationTitle');

    const brandingValidation: BrandingValidation = {
      isLogoDefaultValid,
      isLogoDarkmodeValid,
      isMarkDefaultValid,
      isMarkDarkmodeValid,
      isLoadingLogoDefaultValid,
      isLoadingLogoDarkmodeValid,
      isFaviconValid,
      isTitleValid,
    };

    return brandingValidation;
  };

  private async getUiConfig(uiPlugins: UiPlugins, pluginId: string) {
    const browserConfig = uiPlugins.browserConfigs.get(pluginId);

    return ((await browserConfig?.pipe(take(1)).toPromise()) ?? {}) as Record<string, any>;
  }

  /**
   * Validation function for URLs. Use Axios to call URL and check validity.
   * Also needs to be ended with png, svg, gif, PNG, SVG and GIF.
   *
   * @param {string} url
   * @param {string} configName
   * @returns {boolean} indicate if the URL is valid/invalid
   */
  public isUrlValid = async (url: string, configName?: string): Promise<boolean> => {
    if (url === '/') {
      return false;
    }
    if (url.match(/\.(png|svg|gif|PNG|SVG|GIF)$/) === null) {
      this.logger.get('branding').error(`${configName} config is invalid. Using default branding.`);
      return false;
    }
    if (url.startsWith('/')) {
      return true;
    }
    return await Axios.get(url, {
      httpsAgent: this.httpsAgent,
      adapter: 'http',
      maxRedirects: 0,
    })
      .then(() => {
        return true;
      })
      .catch(() => {
        this.logger
          .get('branding')
          .error(`${configName} URL was not found or invalid. Using default branding.`);
        return false;
      });
  };

  /**
   * Validation function for applicationTitle config.
   * Title length needs to be between 1 to 36 letters.
   *
   * @param {string} title
   * @param {string} configName
   * @returns {boolean} indicate if user input title is valid/invalid
   */
  public isTitleValid = (title: string, configName?: string): boolean => {
    if (!title) {
      return false;
    }
    if (title.length > 36) {
      this.logger
        .get('branding')
        .error(
          `${configName} config is not found or invalid. Title length should be between 1 to 36 characters. Using default title.`
        );
      return false;
    }
    return true;
  };
}
