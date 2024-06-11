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

/* Note:
 *   This file uses ES5 in order to provide meaningful output even if an old Node.js runtime is used.
 *
 * The exit codes facilitating the testing are:
 *   21: JS runtime version doesn't satisfy the range specific in `engines.node` of `package.json`.
 *   22: `package.json` is missing `engines.node` or it is not a string.
 *   23: `package.json` has a `engines.node` that is not a valid semver range.
 *   24: `package.json` has a `engines.node` that has a major of zero.
 *   25: JS runtime did not report `process.version`.
 *   26: JS runtime returned a `process.version` that didn't match semver.
 */

var pkg = require('../../package.json');

var versionMatcher = /^\s*v?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\D.*)?$/;
var rangeMatcher = /^\s*(>=?|\^|~|=)?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[^\d.].*)?$/;

var ERR_MISSING_REQUIREMENTS =
  'OpenSearch Dashboards did not report its required version of the Node.js runtime';
var ERR_BAD_REQUIREMENTS = ERR_MISSING_REQUIREMENTS + ' in a valid format';
var _BAD_REQUIREMENTS_SUFFIX =
  '. Please revert any changes that might have been made to the package.json file and try again.';
ERR_MISSING_REQUIREMENTS += _BAD_REQUIREMENTS_SUFFIX;
ERR_BAD_REQUIREMENTS += _BAD_REQUIREMENTS_SUFFIX;

var pkgEngineNodeVersion = pkg && pkg.engines && pkg.engines.node;
if (!pkgEngineNodeVersion || typeof pkgEngineNodeVersion !== 'string') {
  console.error(ERR_MISSING_REQUIREMENTS);
  process.exit(22);
}

/* Basic semver parsing: This is a very limited subset of what semver supports where only a single comparator, composed
 * of an operator and a version, is supported.
 * [https://github.com/npm/node-semver/blob/cb1ca1d5480a6c07c12ac31ba5f2071ed530c4ed/README.md#ranges]
 *
 * The supported operators are:
 *   >    Greater than
 *   >=   Greater than or equal to
 *   =    Equal
 *   ~    Tilde ranges: Allows patch changes if a minor version is specified but if only a major version is specified,
 *          it allows minor changes.
 *   ^    Caret ranges: Allows patch and minor updates when major is non-zero (and we will never have that).
 *
 * Note: If no operator is specified, equality is assumed.
 */
var requiredParts = pkgEngineNodeVersion.match(rangeMatcher);
if (requiredParts === null) {
  console.error(ERR_BAD_REQUIREMENTS);
  process.exit(23);
}

var comparatorVersion = {
  major: requiredParts[2],
  minor: requiredParts[3],
  patch: requiredParts[4],
};
var comparatorOperator = requiredParts[1] || '=';
var rangeBottom = {
  major: parseInt(comparatorVersion.major, 10) || 0,
  minor: parseInt(comparatorVersion.minor, 10) || 0,
  patch: parseInt(comparatorVersion.patch, 10) || 0,
  inclusive: comparatorOperator.indexOf('>') === -1 || comparatorOperator.indexOf('=') > -1,
};
var rangeTop = undefined;

if (!rangeBottom.major) {
  console.error(ERR_BAD_REQUIREMENTS);
  process.exit(24);
}

if (comparatorOperator === '>') {
  if (!comparatorVersion.minor) {
    // >3 is >=4.0.0
    rangeBottom.major += 1;
    rangeBottom.inclusive = true;
  } else if (!comparatorVersion.patch) {
    // >3.1 is >=3.2.0
    rangeBottom.minor += 1;
    rangeBottom.inclusive = true;
  }
}

// =3 is ~3.0.0 and =3.1 is ~3.1.0
if (comparatorOperator === '=' && (!comparatorVersion.minor || !comparatorVersion.patch)) {
  comparatorOperator = '~';
}

// =3.1.4
if (comparatorOperator === '=') {
  rangeTop = {
    major: rangeBottom.major,
    minor: rangeBottom.minor,
    patch: rangeBottom.patch,
    inclusive: true,
  };
} else if (comparatorOperator === '~') {
  if (comparatorVersion.minor) {
    // ~3.1.4 and ~3.1 are <3.2.0
    rangeTop = {
      major: rangeBottom.major,
      minor: rangeBottom.minor + 1,
      patch: 0,
    };
  } else {
    // ~3 is <4.0.0
    rangeTop = {
      major: rangeBottom.major + 1,
      minor: 0,
      patch: 0,
    };
  }
} else if (comparatorOperator === '^') {
  // ^3.1.4 is <4.0.0
  rangeTop = {
    major: rangeBottom.major + 1,
    minor: 0,
    patch: 0,
  };
}

function getVersionCompatibilityMessage() {
  var versionBottom = 'v' + rangeBottom.major + '.' + rangeBottom.minor + '.' + rangeBottom.patch;
  if (comparatorOperator === '=') {
    return 'Please use Node.js ' + versionBottom + '.';
  }

  var message = 'Please use a Node.js runtime version that is greater than ' + versionBottom;
  if (rangeBottom.inclusive) {
    message = 'Please use a Node.js runtime version that is ' + versionBottom + ' or greater';
  }

  if (!rangeTop) return message + '.';

  var versionTop = 'v' + rangeTop.major + '.' + rangeTop.minor + '.' + rangeTop.patch;
  // The only operator with a truthy `rangeTop.inclusive` is the `=` which was handled above
  return message + ' and lower than ' + versionTop + '.';
}

/* Compares the 2 versions and returns
 *   1: A  >  B
 *   0: A === B
 *  -1: A  <  B
 */
function versionCompare(versionA, versionB) {
  // 4.x.x > 3.1.4
  if (versionA.major > versionB.major) return 1;
  else if (versionA.major === versionB.major) {
    // 3.2.x > 3.1.4
    if (versionA.minor > versionB.minor) return 1;
    else if (versionA.minor === versionB.minor) {
      // 3.1.5 >= 3.1.4
      if (versionA.patch > versionB.patch) return 1;
      // 3.1.4 = 3.1.4
      else if (versionA.patch === versionB.patch) return 0;
    }
  }

  return -1;
}

var currentVersion = process && process.version;
if (!currentVersion) {
  console.error(
    'OpenSearch Dashboards cannot start up because the JavaScript runtime did not report its version. ' +
      getVersionCompatibilityMessage()
  );
  process.exit(25);
}

var currentParts = currentVersion.match(versionMatcher);
if (currentParts === null) {
  console.error(
    'OpenSearch Dashboards cannot start up because the JavaScript runtime did not report its version in a ' +
      'discernible format. ' +
      getVersionCompatibilityMessage()
  );
  process.exit(26);
}

var version = {
  major: parseInt(currentParts[1], 10) || 0,
  minor: parseInt(currentParts[2], 10) || 0,
  patch: parseInt(currentParts[3], 10) || 0,
};

var satisfiesBottom = false;

// Check if version is greater than rangeBottom or if equal, that `rangeBottom` is inclusive
var versionComparedToRangeBottom = versionCompare(version, rangeBottom);
if (versionComparedToRangeBottom === 1) satisfiesBottom = true;
else if (rangeBottom.inclusive && versionComparedToRangeBottom === 0) satisfiesBottom = true;

var satisfiesTop = false;

if (satisfiesBottom && rangeTop) {
  var versionComparedToRangeTop = versionCompare(version, rangeTop);
  if (versionComparedToRangeTop === -1) satisfiesTop = true;
  else if (rangeTop.inclusive && versionComparedToRangeTop === 0) satisfiesTop = true;
}

// Fail if the Node.js version doesn't satisfy the requirements of OpenSearch Dashboards
if (!satisfiesBottom || (rangeTop && !satisfiesTop)) {
  console.error(
    'OpenSearch Dashboards cannot start up using the Node.js runtime v' +
      version.major +
      '.' +
      version.minor +
      '.' +
      version.patch +
      '. ' +
      getVersionCompatibilityMessage()
  );
  process.exit(21);
}
