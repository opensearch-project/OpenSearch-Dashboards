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

interface Props {
  url: RenderingMetadata['uiPublicUrl'];
  theme: RenderingMetadata['themeVersion'];
}

interface FontFace {
  family: string;
  variants: Array<{
    style: 'normal' | 'italic';
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    sources: string[];
    unicodeRange?: string;
    format?: string;
  }>;
}

export const Fonts: FunctionComponent<Props> = ({ url, theme }) => {
  // For next theme
  const sourceSans3: FontFace = {
    family: 'Source Sans 3',
    variants: [
      {
        weight: 200,
        style: 'normal',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-ExtraLight.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-ExtraLight.otf.woff`,
        ],
      },
      {
        weight: 200,
        style: 'italic',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-ExtraLightIt.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-ExtraLightIt.otf.woff`,
        ],
      },
      {
        weight: 300,
        style: 'normal',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-Light.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-Light.otf.woff`,
        ],
      },
      {
        weight: 300,
        style: 'italic',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-LightIt.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-LightIt.otf.woff`,
        ],
      },
      {
        weight: 400,
        style: 'normal',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-Regular.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-Regular.otf.woff`,
        ],
      },
      {
        weight: 400,
        style: 'italic',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-It.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-It.otf.woff`,
        ],
      },
      {
        weight: 600,
        style: 'normal',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-Semibold.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-Semibold.otf.woff`,
        ],
      },
      {
        weight: 600,
        style: 'italic',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-SemiboldIt.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-SemiboldIt.otf.woff`,
        ],
      },
      {
        weight: 700,
        style: 'normal',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-Bold.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-Bold.otf.woff`,
        ],
      },
      {
        weight: 700,
        style: 'italic',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-BoldIt.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-BoldIt.otf.woff`,
        ],
      },
      {
        weight: 900,
        style: 'normal',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-Black.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-Black.otf.woff`,
        ],
      },
      {
        weight: 900,
        style: 'italic',
        sources: [
          `${url}/fonts/source_sans_3/SourceSans3-BlackIt.ttf.woff2`,
          `${url}/fonts/source_sans_3/SourceSans3-BlackIt.otf.woff`,
        ],
      },
    ],
  };
  const sourceCodePro: FontFace = {
    family: 'Source Code Pro',
    variants: [
      {
        weight: 200,
        style: 'normal',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-ExtraLight.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-ExtraLight.otf.woff`,
        ],
      },
      {
        weight: 200,
        style: 'italic',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-ExtraLightIt.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-ExtraLightIt.otf.woff`,
        ],
      },
      {
        weight: 300,
        style: 'normal',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-Light.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-Light.otf.woff`,
        ],
      },
      {
        weight: 300,
        style: 'italic',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-LightIt.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-LightIt.otf.woff`,
        ],
      },
      {
        weight: 400,
        style: 'normal',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-Regular.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-Regular.otf.woff`,
        ],
      },
      {
        weight: 400,
        style: 'italic',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-It.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-It.otf.woff`,
        ],
      },
      {
        weight: 500,
        style: 'normal',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-Medium.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-Medium.otf.woff`,
        ],
      },
      {
        weight: 500,
        style: 'italic',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-MediumIt.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-MediumIt.otf.woff`,
        ],
      },
      {
        weight: 600,
        style: 'normal',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-Semibold.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-Semibold.otf.woff`,
        ],
      },
      {
        weight: 600,
        style: 'italic',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-SemiboldIt.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-SemiboldIt.otf.woff`,
        ],
      },
      {
        weight: 700,
        style: 'normal',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-Bold.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-Bold.otf.woff`,
        ],
      },
      {
        weight: 700,
        style: 'italic',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-BoldIt.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-BoldIt.otf.woff`,
        ],
      },
      {
        weight: 900,
        style: 'normal',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-Black.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-Black.otf.woff`,
        ],
      },
      {
        weight: 900,
        style: 'italic',
        sources: [
          `${url}/fonts/source_code_pro/SourceCodePro-BlackIt.ttf.woff2`,
          `${url}/fonts/source_code_pro/SourceCodePro-BlackIt.otf.woff`,
        ],
      },
    ],
  };

  // ToDo [NEW THEME]: Remove these fonts and their files when the theme is released: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4301
  const interUi: FontFace = {
    family: 'Inter UI',
    variants: [
      {
        style: 'normal',
        weight: 100,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-Thin-BETA.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-Thin-BETA.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 100,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-ThinItalic-BETA.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-ThinItalic-BETA.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 200,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-ExtraLight-BETA.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-ExtraLight-BETA.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 200,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-ExtraLightItalic-BETA.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-ExtraLightItalic-BETA.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 300,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-Light-BETA.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-Light-BETA.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 300,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-LightItalic-BETA.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-LightItalic-BETA.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 400,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-Regular.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-Regular.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 400,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-Italic.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-Italic.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 500,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-Medium.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-Medium.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 500,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-MediumItalic.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-MediumItalic.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 600,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-SemiBold.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-SemiBold.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 600,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-SemiBoldItalic.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-SemiBoldItalic.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 700,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-Bold.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-Bold.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 700,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-BoldItalic.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-BoldItalic.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 800,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-ExtraBold.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-ExtraBold.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 800,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-ExtraBoldItalic.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-ExtraBoldItalic.woff`,
        ],
      },
      {
        style: 'normal',
        weight: 900,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-Black.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-Black.woff`,
        ],
      },
      {
        style: 'italic',
        weight: 900,
        sources: [
          `${url}/fonts/inter_ui/Inter-UI-BlackItalic.woff2`,
          `${url}/fonts/inter_ui/Inter-UI-BlackItalic.woff`,
        ],
      },
    ],
  };
  const roboto: FontFace = {
    family: 'Roboto Mono',
    variants: [
      {
        style: 'normal',
        weight: 400,
        format: 'woff2',
        sources: [
          'Roboto Mono',
          'RobotoMono-Regular',
          `${url}/fonts/roboto_mono/RobotoMono-Regular.ttf`,
        ],
        unicodeRange:
          'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
      },
      {
        style: 'italic',
        weight: 400,
        sources: [
          'Roboto Mono Italic',
          'RobotoMono-Italic',
          `${url}/fonts/roboto_mono/RobotoMono-Italic.ttf`,
        ],
        unicodeRange:
          'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
      },
      {
        style: 'normal',
        weight: 700,
        format: 'woff2',
        sources: [
          'Roboto Mono Bold',
          'RobotoMono-Bold',
          `${url}/fonts/roboto_mono/RobotoMono-Bold.ttf`,
        ],
        unicodeRange:
          'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
      },
      {
        style: 'italic',
        weight: 700,
        format: 'woff2',
        sources: [
          'Roboto Mono Bold Italic',
          'RobotoMono-BoldItalic',
          `${url}/fonts/roboto_mono/RobotoMono-BoldItalic.ttf`,
        ],
        unicodeRange:
          'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
      },
    ],
  };

  /*
  Single variable font.

  Note that you may want to do something like this to make sure you're serving
  constant fonts to older browsers:
  html {
    font-family: 'Inter UI', sans-serif;
  }
  @supports (font-variation-settings: normal) {
    html {
      font-family: 'Inter UI var', sans-serif;
    }
  }

  BUGS:
  - Safari 12.0 will default to italic instead of regular when font-weight
    is provided in a @font-face declaration.
    Workaround: Use 'Inter UI var alt' for Safari, or explicitly set
    \`font-variation-settings: 'slnt' DEGREE\`.

  @font-face {
    font-family: 'Inter UI var';
    font-weight: 100 900;
    font-style: oblique 0deg 10deg;
    src:
      url('${url}/fonts/inter_ui/Inter-UI.var.woff2') format('woff2-variations'),
      url('${url}/fonts/inter_ui/Inter-UI.var.woff2') format('woff2');
  }

  'Inter UI var alt' is recommended for Safari and Edge, for reliable italics.

  @supports (font-variation-settings: normal) {
    html {
      font-family: 'Inter UI var alt', sans-serif;
    }
  }

  @font-face {
    font-family: 'Inter UI var alt';
    font-weight: 100 900;
    font-style: normal;
    font-named-instance: 'Regular';
    src:
      url('${url}/fonts/inter_ui/Inter-UI-upright.var.woff2') format('woff2 supports variations(gvar)'),
      url('${url}/fonts/inter_ui/Inter-UI-upright.var.woff2') format('woff2-variations'),
      url('${url}/fonts/inter_ui/Inter-UI-upright.var.woff2') format('woff2');
  }
  @font-face {
    font-family: 'Inter UI var alt';
    font-weight: 100 900;
    font-style: italic;
    font-named-instance: 'Italic';
    src:
      url('${url}/fonts/inter_ui/Inter-UI-italic.var.woff2') format('woff2 supports variations(gvar)'),
      url('${url}/fonts/inter_ui/Inter-UI-italic.var.woff2') format('woff2-variations'),
      url('${url}/fonts/inter_ui/Inter-UI-italic.var.woff2') format('woff2');
  }
  */
  const fontText = theme === 'v7' ? interUi : sourceSans3;
  const fontCode = theme === 'v7' ? roboto : sourceCodePro;
  const fontsDefinitionRules = [fontText, fontCode]
    .flatMap(({ family, variants }) =>
      variants.map(({ style, weight, format, sources, unicodeRange }) => {
        const src = sources
          .map((source) =>
            source.startsWith(url)
              ? `url('${source}') format('${format || source.split('.').pop()}')`
              : `local('${source}')`
          )
          .join(', ');

        return `
        @font-face {
          font-family: '${family}';
          font-style: ${style};
          font-weight: ${weight};
          src: ${src};
          ${unicodeRange ? `unicode-range: ${unicodeRange};` : ''}
        }`;
      })
    )
    .join('\n');

  /*
   * The default fonts are added as CSS variables, overriding OUI's, and then
   * the CSS variables are consumed.
   */
  const fontRules = `
    :root {
      --font-text: "${fontText.family}", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
                   sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";

      --font-code: "${fontCode.family}", Consolas, Menlo, Courier, monospace;

      --oui-font-family: var(--font-text);
      --oui-code-font-family: var(--font-code);
    }

    code, pre, kbd, samp {
      font-family: var(--font-code);
    }
    html, input, textarea, select, button {
      font-family: var(--font-text);
    }

  `;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        ${fontsDefinitionRules}
        ${fontRules}
      `,
      }}
    />
  );
};
