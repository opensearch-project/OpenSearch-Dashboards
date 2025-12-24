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

import webpack from 'webpack';
import { parseThemeTags, ALL_THEMES, ThemeTag } from '../common';

const getStringifiedRequest = (loaderContext: webpack.LoaderContext<any>, request: string) => {
  return JSON.stringify(
    loaderContext.utils.contextify(loaderContext.context || loaderContext.rootContext, request)
  );
};

const getVersion = (tag: ThemeTag) => (tag.includes('v7') ? 7 : 8);
const getIsDark = (tag: ThemeTag) => tag.includes('dark');
const compare = (a: ThemeTag, b: ThemeTag) =>
  (getVersion(a) === getVersion(b) ? 1 : 0) + (getIsDark(a) === getIsDark(b) ? 1 : 0);

// eslint-disable-next-line import/no-default-export
export default function (this: webpack.LoaderContext<any>) {
  this.cacheable(true);

  const options = this.getOptions();
  const bundleId: string = options.bundleId;
  const themeTags = parseThemeTags(options.themeTags);

  const cases = ALL_THEMES.map((tag) => {
    if (themeTags.includes(tag)) {
      return `
  case '${tag}':
    return require(${getStringifiedRequest(this, `${this.resourcePath}?${tag}`)});`;
    }

    const fallback = themeTags
      .slice()
      .sort((a, b) => compare(b, tag) - compare(a, tag))
      .shift()!;

    const message = `SASS files in [${bundleId}] were not built for theme [${tag}]. Styles were compiled using the [${fallback}] theme instead to keep OpenSearch Dashboards somewhat usable. Please adjust the advanced settings to make use of [${themeTags}] or make sure the OSD_OPTIMIZER_THEMES environment variable includes [${tag}] in a comma separated list of themes you want to compile. You can also set it to "*" to build all themes.`;
    return `
  case '${tag}':
    console.error(new Error(${JSON.stringify(message)}));
    return require(${getStringifiedRequest(this, `${this.resourcePath}?${fallback}`)})`;
  }).join('\n');

  return `
switch (window.__osdThemeTag__) {${cases}
}`;
}
