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
import { getLogos, ImageType } from '../../../common';

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
  const logos = getLogos(injectedMetadata.branding, injectedMetadata.serverBasePath);

  const favicon = injectedMetadata.branding.faviconUrl;
  const applicationTitle = injectedMetadata.branding.applicationTitle || 'OpenSearch Dashboards';

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="viewport" content="width=device-width" />
        <title>{applicationTitle}</title>
        {/**
         * ToDo: Custom branded favicons will not work correctly across all browsers with
         * these `link` elements and single type. Try to guess the image and use only one.
         *
         * Favicons (generated from https://realfavicongenerator.net/)
         *
         * For user customized favicon using yml file:
         * If user inputs a valid URL, we guarantee basic favicon customization, such as
         * browser favicon(Chrome, Firefox, Safari, and Edge), apple touch icon, safari
         * pinned icon. (For Safari browser favicon, we recommend input a png image URL,
         * svg image URL might not work)
         *
         * we do not guarantee other advanced favicon customization such as
         * windows tile icon, Android device favicon etc. However, the opensearch favicon
         * will not be shown at those places and the default browser/device icon will be shown instead.
         *
         * If user inputs an invalid URL, original Opensearch Dashboards favicon will be used.
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

        {/* Ignoring all of the above, Safari picks this one */}
        <link
          rel="mask-icon"
          color="#003553"
          href={favicon ?? `${uiPublicUrl}/favicons/safari-pinned-tab.svg`}
        />
        <link rel="shortcut icon" href={favicon ?? `${uiPublicUrl}/favicons/favicon.ico`} />

        <meta
          name="msapplication-config"
          content={favicon ? `` : `${uiPublicUrl}/favicons/browserconfig.xml`}
        />

        <meta name="theme-color" content="#ffffff" />
        <Styles darkMode={darkMode} theme={themeVersion} />

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
            <div className="loadingLogoContainer">
              <img
                className="loadingLogo"
                src={logos.AnimatedMark.url}
                alt={`${applicationTitle} logo`}
                data-test-subj={`${logos.AnimatedMark.type}Logo`}
                data-test-image-url={logos.AnimatedMark.url}
                loading="eager"
              />
            </div>
            <div
              className="osdWelcomeText"
              data-error-message={i18n('core.ui.welcomeErrorMessage', {
                defaultMessage: `${applicationTitle} did not load properly. Check the server output for more information.`,
              })}
            >
              {i18n('core.ui.welcomeMessage', {
                defaultMessage: `Loading ${applicationTitle}`,
              })}
            </div>
            {/* Show a progress bar if a static custom branded logo is used */}
            {logos.AnimatedMark.type === ImageType.ALTERNATIVE && <div className="osdProgress" />}
          </div>
        </div>

        <div className="osdWelcomeView" id="osd_legacy_browser_error" style={{ display: 'none' }}>
          <img
            data-test-subj={logos.Mark.type + ' logo'}
            data-test-image-url={logos.Mark.url}
            src={logos.Mark.url}
            alt={`${applicationTitle} logo`}
            className="legacyBrowserErrorLogo"
          />

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
