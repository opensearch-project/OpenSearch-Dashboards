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

import React, { FunctionComponent, createElement } from 'react';

import { RenderingMetadata } from '../types';
import { Fonts } from './fonts';
import { Styles } from './styles';

interface Props {
  metadata: RenderingMetadata;
}

export const Template: FunctionComponent<Props> = ({
  metadata: {
    uiPublicUrl,
    locale,
    darkMode,
    themeVersion,
    injectedMetadata,
    i18n,
    bootstrapScriptUrl,
    strictCsp,
  },
}) => {
  const openSearchLogo = (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M61.7374 23.5C60.4878 23.5 59.4748 24.513 59.4748 25.7626C59.4748 44.3813 44.3813 59.4748 25.7626 59.4748C24.513 59.4748 23.5 60.4878 23.5 61.7374C23.5 62.987 24.513 64 25.7626 64C46.8805 64 64 46.8805 64 25.7626C64 24.513 62.987 23.5 61.7374 23.5Z"
        fill="#005EB8"
      />
      <path
        d="M48.0814 38C50.2572 34.4505 52.3615 29.7178 51.9475 23.0921C51.0899 9.36725 38.6589 -1.04463 26.9206 0.0837327C22.3253 0.525465 17.6068 4.2712 18.026 10.9805C18.2082 13.8961 19.6352 15.6169 21.9544 16.9399C24.1618 18.1992 26.9978 18.9969 30.2128 19.9011C34.0962 20.9934 38.6009 22.2203 42.063 24.7717C46.2125 27.8295 49.0491 31.3743 48.0814 38Z"
        fill="#003B5C"
      />
      <path
        d="M3.91861 14C1.74276 17.5495 -0.361506 22.2822 0.0524931 28.9079C0.910072 42.6327 13.3411 53.0446 25.0794 51.9163C29.6747 51.4745 34.3932 47.7288 33.974 41.0195C33.7918 38.1039 32.3647 36.3831 30.0456 35.0601C27.8382 33.8008 25.0022 33.0031 21.7872 32.0989C17.9038 31.0066 13.3991 29.7797 9.93694 27.2283C5.78746 24.1704 2.95092 20.6257 3.91861 14Z"
        fill="#005EB8"
      />
    </svg>
  );
  const openSearchLogoSpinner = (
    <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M75.7374 37.5C74.4878 37.5 73.4748 38.513 73.4748 39.7626C73.4748 58.3813 58.3813 73.4748 39.7626 73.4748C38.513 73.4748 37.5 74.4878 37.5 75.7374C37.5 76.987 38.513 78 39.7626 78C60.8805 78 78 60.8805 78 39.7626C78 38.513 76.987 37.5 75.7374 37.5Z"
          fill="#005EB8"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 40 40"
          to="359.9 40 40"
          dur="1.5s"
          repeatCount="indefinite"
          values="0 40 40; 15 40 40; 340 40 40; 359.9 40 40"
          keyTimes="0; .3; .7; 1"
        />
      </g>
      <path
        d="M62.0814 52C64.2572 48.4505 66.3615 43.7178 65.9475 37.0921C65.0899 23.3673 52.6589 12.9554 40.9206 14.0837C36.3253 14.5255 31.6068 18.2712 32.026 24.9805C32.2082 27.8961 33.6352 29.6169 35.9544 30.9399C38.1618 32.1992 40.9978 32.9969 44.2128 33.9011C48.0962 34.9934 52.6009 36.2203 56.0631 38.7717C60.2125 41.8296 63.0491 45.3743 62.0814 52Z"
        fill="#003B5C"
      />
      <path
        d="M17.9186 28C15.7428 31.5495 13.6385 36.2822 14.0525 42.9079C14.9101 56.6327 27.3411 67.0446 39.0794 65.9163C43.6747 65.4745 48.3932 61.7288 47.974 55.0195C47.7918 52.1039 46.3647 50.3831 44.0456 49.0601C41.8382 47.8008 39.0022 47.0031 35.7872 46.0989C31.9038 45.0066 27.3991 43.7797 23.9369 41.2283C19.7875 38.1704 16.9509 34.6257 17.9186 28Z"
        fill="#005EB8"
      />
    </svg>
  );

  const loadingLogoDefault = injectedMetadata.branding.loadingLogo?.defaultUrl;
  const loadingLogoDarkMode = injectedMetadata.branding.loadingLogo?.darkModeUrl;
  const markDefault = injectedMetadata.branding.mark?.defaultUrl;
  const markDarkMode = injectedMetadata.branding.mark?.darkModeUrl;
  const favicon = injectedMetadata.branding.faviconUrl;
  const applicationTitle = injectedMetadata.branding.applicationTitle;

  /**
   * Use branding configurations to check which URL to use for rendering
   * loading logo in default mode. In default mode, loading logo will
   * proritize default loading logo URL, and then default mark URL.
   * If both are invalid, default opensearch logo and spinner will be rendered.
   *
   * @returns a valid custom URL or undefined if no valid URL is provided
   */
  const customLoadingLogoDefaultMode = () => {
    return loadingLogoDefault ?? markDefault ?? undefined;
  };

  /**
   * Use branding configurations to check which URL to use for rendering
   * loading logo in default mode. In dark mode, loading logo will proritize
   * loading logo URLs, then mark logo URLs.
   * Within each type, the dark mode URL will be proritized if provided.
   *
   * @returns a valid custom URL or undefined if no valid URL is provided
   */
  const customLoadingLogoDarkMode = () => {
    return loadingLogoDarkMode ?? loadingLogoDefault ?? markDarkMode ?? markDefault ?? undefined;
  };

  /**
   * Render custom loading logo for both default mode and dark mode
   *
   * @returns a valid custom loading logo URL, or undefined
   */
  const customLoadingLogo = () => {
    return darkMode ? customLoadingLogoDarkMode() : customLoadingLogoDefaultMode();
  };

  /**
   * Check if a horizontal loading is needed to be rendered.
   * Loading bar will be rendered only when a default mode mark URL or
   * dark mode mark URL is rendered as the loading logo. We add the
   * horizontal loading bar on the bottom of the static mark logo to have
   * some loading effect for the loading page.
   *
   * @returns a loading bar component or no loading bar component
   */
  const renderBrandingEnabledOrDisabledLoadingBar = () => {
    if (customLoadingLogo() && !loadingLogoDefault) {
      return <div className="osdProgress" />;
    }
  };

  /**
   * Check if we render a custom loading logo or the default opensearch spinner.
   * If customLoadingLogo() returns undefined(no valid custom URL is found), we
   * render the default opensearch logo spinenr
   *
   * @returns a image component with custom logo URL, or the default opensearch logo spinner
   */
  const renderBrandingEnabledOrDisabledLoadingLogo = () => {
    if (customLoadingLogo()) {
      return (
        <div className="loadingLogoContainer">
          <img className="loadingLogo" src={customLoadingLogo()} alt={applicationTitle + ' logo'} />
        </div>
      );
    }
    return openSearchLogoSpinner;
  };

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="viewport" content="width=device-width" />
        <title>{applicationTitle}</title>
        {/**
         * Favicons (generated from https://realfavicongenerator.net/)
         *
         * For user customized favicon using yml file:
         * If user inputs a valid URL, we gurantee basic favicon customization, such as
         * browser favicon(Chrome, Firefox, Safari, and Edge), apple touch icon, safari
         * pinned icon. (For Safari browser favicon, we recommend input a png image URL,
         * svg image URL might not work)
         *
         * we do not guarantee other advanced favicon customization such as
         * windows tile icon, Andriod device favicon etc. However, the opensearch favicon
         * will not be shown at those places and the default browser/device icon will be shown instead.
         *
         * If user inputs a invalid URL, original opensearch favicon will be used.
         */}

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={favicon ?? `${uiPublicUrl}/favicons/apple-touch-icon.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={favicon ?? `${uiPublicUrl}/favicons/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={favicon ?? `${uiPublicUrl}/favicons/favicon-16x16.png`}
        />

        <link rel="manifest" href={favicon ? `` : `${uiPublicUrl}/favicons/manifest.json`} />

        <link
          rel="mask-icon"
          color="#e8488b"
          href={favicon ?? `${uiPublicUrl}/favicons/safari-pinned-tab.svg`}
        />
        <link rel="shortcut icon" href={favicon ?? `${uiPublicUrl}/favicons/favicon.ico`} />

        <meta
          name="msapplication-config"
          content={favicon ? `` : `${uiPublicUrl}/favicons/browserconfig.xml`}
        />

        <meta name="theme-color" content="#ffffff" />
        <Styles darkMode={darkMode} />

        {/* Inject stylesheets into the <head> before scripts so that KP plugins with bundled styles will override them */}
        <meta name="add-styles-here" />
        <meta name="add-scripts-here" />

        {/* Place fonts after styles that would be injected later to make sure nothing overrides them */}
        <Fonts url={uiPublicUrl} theme={themeVersion} />
      </head>
      <body>
        {createElement('osd-csp', {
          data: JSON.stringify({ strictCsp }),
        })}
        {createElement('osd-injected-metadata', { data: JSON.stringify(injectedMetadata) })}
        <div
          className="osdWelcomeView"
          id="osd_loading_message"
          style={{ display: 'none' }}
          data-test-subj="osdLoadingMessage"
        >
          <div className="osdLoaderWrap" data-test-subj="loadingLogo">
            {renderBrandingEnabledOrDisabledLoadingLogo()}
            <div
              className="osdWelcomeText"
              data-error-message={i18n('core.ui.welcomeErrorMessage', {
                defaultMessage: `${injectedMetadata.branding.applicationTitle} did not load properly. Check the server output for more information.`,
              })}
            >
              {i18n('core.ui.welcomeMessage', {
                defaultMessage: `Loading ${injectedMetadata.branding.applicationTitle}`,
              })}
            </div>
            {renderBrandingEnabledOrDisabledLoadingBar()}
          </div>
        </div>

        <div className="osdWelcomeView" id="osd_legacy_browser_error" style={{ display: 'none' }}>
          {openSearchLogo}

          <h2 className="osdWelcomeTitle">
            {i18n('core.ui.legacyBrowserTitle', {
              defaultMessage: 'Please upgrade your browser',
            })}
          </h2>
          <div className="osdWelcomeText">
            {i18n('core.ui.legacyBrowserMessage', {
              defaultMessage:
                'This OpenSearch installation has strict security requirements enabled that your current browser does not meet.',
            })}
          </div>
        </div>

        <script>
          {`
            // Since this is an unsafe inline script, this code will not run
            // in browsers that support content security policy(CSP). This is
            // intentional as we check for the existence of __osdCspNotEnforced__ in
            // bootstrap.
            window.__osdCspNotEnforced__ = true;
          `}
        </script>
        <script src={bootstrapScriptUrl} />
      </body>
    </html>
  );
};
