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

/**
 * Strips dependency messages from @tailwindcss/postcss.
 *
 * Without this, Tailwind registers every scanned .tsx as a PostCSS dependency.
 * postcss-loader converts those into webpack file deps, causing an infinite
 * JS to CSS to JS recompile loop. Stripping them breaks the cycle. Tailwind re-scans
 * source files on each run anyway, so new utility classes are still picked up.
 */
function stripTailwindDeps() {
  return {
    postcssPlugin: 'postcss-strip-tailwind-deps',
    OnceExit(_root, { result }) {
      result.messages = result.messages.filter((msg) => msg.plugin !== '@tailwindcss/postcss');
    },
  };
}
stripTailwindDeps.postcss = true;

/**
 * Removes @layer wrappers from Tailwind v4 output.
 *
 * Layered rules always lose to unlayered ones. Since OSD's existing styles
 * (EUI, etc.) are unlayered, Tailwind utilities inside @layer get overridden.
 * Only runs when @tailwindcss/postcss processed the file.
 *  - Removes @layer base (Tailwind reset conflicts with OSD)
 *  - Unwraps @layer theme / utilities (keeps content, drops wrapper)
 *  - Keeps @layer properties (@property declarations are fine in layers)
 */
function stripCssLayers() {
  return {
    postcssPlugin: 'postcss-strip-css-layers',
    OnceExit(root, { result }) {
      const tailwindRan = result.messages.some((msg) => msg.plugin === '@tailwindcss/postcss');
      if (!tailwindRan) return;

      root.walkAtRules('layer', (rule) => {
        const name = rule.params.trim();
        if (name === 'base' || name === 'components' || name.includes(',')) {
          rule.remove();
        } else if (name === 'theme' || name === 'utilities') {
          rule.replaceWith(rule.nodes);
        }
      });
    },
  };
}
stripCssLayers.postcss = true;

module.exports = {
  plugins: [
    /*require('autoprefixer')()*/
    // Safe to include unconditionally. Bails out for files without Tailwind directives.
    // eslint-disable-next-line import/no-unresolved -- package uses `exports` field; resolver lacks support
    require('@tailwindcss/postcss')(),
    stripCssLayers(),
    stripTailwindDeps(),
  ],
};
