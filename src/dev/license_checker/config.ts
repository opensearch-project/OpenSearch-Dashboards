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

// ToDo: Make an allow-list for packages with licenses that require attribution so
//       they can be allowed only after attribution is added but fail before.

// The following list applies to packages both
// used as dependencies or dev dependencies
export const LICENSE_ALLOWLIST = [
  '(AFL-2.1 OR BSD-3-Clause)',
  '(Apache-2.0 AND BSD-3-Clause)',
  '(BSD-2-Clause OR MIT OR Apache-2.0)',
  '(BSD-2-Clause OR MIT)',
  '(BSD-3-Clause AND Apache-2.0)',
  '(BSD-3-Clause OR GPL-2.0)',
  '(GPL-2.0 OR MIT)',
  '(MIT AND CC-BY-3.0)',
  '(MIT AND Zlib)',
  '(MIT OR Apache-2.0)',
  '(MIT AND BSD-3-Clause)',
  '(MIT OR CC0-1.0)',
  '(MIT OR GPL-3.0)',
  '(MPL-2.0 OR Apache-2.0)',
  '(OFL-1.1 AND MIT)',
  '(Unlicense OR Apache-2.0)',
  '(WTFPL OR MIT)',
  '0BSD',
  'AFLv2.1',
  'Apache 2.0',
  'Apache License, Version 2.0',
  'Apache License, v2.0',
  'Apache',
  'Apache*',
  'Apache, Version 2.0',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD 3-Clause',
  'BSD New',
  'BSD',
  'BSD*',
  'BSD-2-Clause',
  'BSD-3-Clause AND MIT',
  'BSD-3-Clause OR MIT',
  'BSD-3-Clause',
  'BSD-like',
  'CC-BY',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'CC0-1.0',
  'Eclipse Distribution License - v 1.0',
  'Elastic-License',
  'FreeBSD',
  'ISC',
  'ISC*',
  'MIT OR GPL-2.0',
  'MIT',
  'MIT*',
  'MIT/X11',
  'Nuclide software',
  'PSF',
  'Public Domain',
  'Python-2.0',
  'Unlicense',
  'WTFPL OR ISC',
  'WTFPL',
  'new BSD, and MIT',
];

// The following list only applies to licenses that
// we wanna allow in packages only used as dev dependencies
export const DEV_ONLY_LICENSE_ALLOWLIST = ['MPL-2.0'];

// Globally overrides a license for a given package@version
export const LICENSE_OVERRIDES = {
  'jackspeak@3.4.0': ['BlueOak-1.0.0'],
  'path-scurry@1.11.1': ['BlueOak-1.0.0'],
  'walk@2.3.9': ['MIT'],
};
