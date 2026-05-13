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

module.exports = {
  plugins: [
    /*require('autoprefixer')()*/
    // Plugins should import "tailwindcss/theme" + "tailwindcss/utilities" rather
    // than the full "tailwindcss" entry. The full entry wraps utilities in
    // @layer base/utilities, which lose specificity to OSD's unlayered EUI styles
    // and forces a fragile postcss post-process to unwrap them. The modular
    // imports emit unlayered utilities directly and skip preflight.
    // Postcss is safe to include unconditionally. Bails out for files without Tailwind directives.
    // eslint-disable-next-line import/no-unresolved -- package uses `exports` field; resolver lacks support
    require('@tailwindcss/postcss')(),
    stripTailwindDeps(),
  ],
};
