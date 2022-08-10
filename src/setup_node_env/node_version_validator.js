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

var pkg = require('../../package.json');

// Note: This is written in ES5 so we can run this before anything else
// and gives support for older NodeJS versions
var currentVersion = (process && process.version) || null;
var rawRequiredVersion = (pkg && pkg.engines && pkg.engines.node) || null;
var requiredVersion = rawRequiredVersion ? 'v' + rawRequiredVersion : rawRequiredVersion;
var currentVersionMajorMinorPatch = currentVersion.match(/^v(\d+)\.(\d+)\.(\d+)/);
var requiredVersionMajorMinorPatch = requiredVersion.match(/^v(\d+)\.(\d+)\.(\d+)/);
var isVersionValid =
  currentVersionMajorMinorPatch[1] === requiredVersionMajorMinorPatch[1] &&
  currentVersionMajorMinorPatch[2] === requiredVersionMajorMinorPatch[2] &&
  parseInt(currentVersionMajorMinorPatch[3], 10) >= parseInt(requiredVersionMajorMinorPatch[3], 10);

// Validates current the NodeJS version compatibility when OpenSearch Dashboards starts.
if (!isVersionValid) {
  var errorMessage =
    `OpenSearch Dashboards was built with ${requiredVersion} and does not support the current Node.js version ${currentVersion}. ` +
    `Please use Node.js ${requiredVersion} or a higher patch version.`;

  // Actions to apply when validation fails: error report + exit.
  console.error(errorMessage);
  process.exit(1);
}
