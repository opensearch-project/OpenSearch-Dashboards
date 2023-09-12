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

/* eslint-disable react/no-danger */

import React, { FunctionComponent } from 'react';

import { RenderingMetadata } from '../types';
import { getThemeDefinition, ThemeColorSchemes } from './theme';

interface Props {
  darkMode: RenderingMetadata['darkMode'];
  theme: RenderingMetadata['themeVersion'];
}

export const Styles: FunctionComponent<Props> = ({ theme, darkMode }) => {
  const themeDefinition = getThemeDefinition(
    theme,
    darkMode ? ThemeColorSchemes.DARK : ThemeColorSchemes.LIGHT
  );

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :root {
            color-scheme: ${darkMode ? 'dark' : 'light'};
          }

          *, *:before, *:after {
            box-sizing: border-box;
          }

          html, body, div, span, svg {
            margin: 0;
            padding: 0;
            border: none;
            vertical-align: baseline;
          }

          body, html {
            width: 100%;
            height: 100%;
            margin: 0;
            display: block;
          }

          {/* used on loading page */}
          .osdWelcomeView {
            line-height: 1.5;
            background-color: ${themeDefinition.ouiHeaderBackgroundColor};
            height: 100%;
            display: -webkit-box;
            display: -webkit-flex;
            display: -ms-flexbox;
            display: flex;
            -webkit-box-flex: 1;
            -webkit-flex: 1 0 auto;
                -ms-flex: 1 0 auto;
                    flex: 1 0 auto;
            -webkit-box-orient: vertical;
            -webkit-box-direction: normal;
            -webkit-flex-direction: column;
                -ms-flex-direction: column;
                    flex-direction: column;
            -webkit-box-align: center;
            -webkit-align-items: center;
                -ms-flex-align: center;
                    align-items: center;
            -webkit-box-pack: center;
            -webkit-justify-content: center;
                -ms-flex-pack: center;
                    justify-content: center;
          }

          .legacyBrowserErrorLogo {
            height: 64px;
          }

          .osdWelcomeTitle {
            color: ${themeDefinition.ouiColorFullShade};
            font-size: 20px;
            margin: 16px 0;
            animation: fadeIn 1s ease-in-out;
            animation-fill-mode: forwards;
            opacity: 0;
            animation-delay: 1.0s;
          }

          .osdWelcomeText {
            display: inline-block;
            font-size: 14px;
            line-height: 40px !important;
            height: 40px !important;
            color: ${themeDefinition.euiColorDarkShade};
          }

          .osdLoaderWrap {
            text-align: center;
            line-height: 1;
            text-align: center;
            letter-spacing: -.005em;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            font-kerning: normal;
            font-weight: 400;
          }

          .osdLoaderWrap svg {
            width: 64px;
            height: 64px;
            margin: auto;
            line-height: 1;
          }

          .osdLoader path {
            stroke: white;
          }

          .osdProgress {
            display: inline-block;
            position: relative;
            width: 32px;
            height: 4px;
            overflow: hidden;
            background-color: ${themeDefinition.euiColorLightestShade};
            line-height: 1;
          }

          .osdProgress:before {
            position: absolute;
            content: '';
            height: 4px;
            width: 100%;
            top: 0;
            bottom: 0;
            left: 0;
            transform: scaleX(0) translateX(0%);
            animation: osdProgress 1s cubic-bezier(.694, .0482, .335, 1) infinite;
            background-color: ${darkMode ? '#1BA9F5' : '#006DE4'};
          }

          .loadingLogoContainer {
            height: 80px;
            padding: 8px;
          }

          .loadingLogo {
            height: 100%;
            max-width: 100%;
          }

          @keyframes osdProgress {
            0% {
              transform: scaleX(1) translateX(-100%);
            }

            100% {
              transform: scaleX(1) translateX(100%);
            }
          }
        `,
      }}
    />
  );
};
