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

const exec = require('child_process').exec;
const pkg = require('../../package.json');

const REQUIRED_NODE_JS_VERSION = 'v' + pkg.engines.node;

describe('NodeVersionValidator', function () {
  it('should run the script WITHOUT error when the version is the same', function (done) {
    testValidateNodeVersion(done, REQUIRED_NODE_JS_VERSION);
  });

  it('should run the script WITHOUT error when only the patch version is higher', function (done) {
    testValidateNodeVersion(done, requiredNodeVersionWithDiff(0, 0, +1));
  });

  it('should run the script WITH error if the patch version is lower', function (done) {
    const lowerPatchversion = requiredNodeVersionWithDiff(0, 0, -1);
    testValidateNodeVersion(
      done,
      lowerPatchversion,
      REQUIRED_NODE_JS_VERSION !== lowerPatchversion
    );
  });

  it('should run the script WITH error if the major version is higher', function (done) {
    testValidateNodeVersion(done, requiredNodeVersionWithDiff(+1, 0, 0), true);
  });

  it('should run the script WITH error if the major version is lower', function (done) {
    const lowerMajorVersion = requiredNodeVersionWithDiff(-1, 0, 0);
    testValidateNodeVersion(
      done,
      lowerMajorVersion,
      REQUIRED_NODE_JS_VERSION !== lowerMajorVersion
    );
  });

  it('should run the script WITH error if the minor version is higher', function (done) {
    testValidateNodeVersion(done, requiredNodeVersionWithDiff(0, +1, 0), true);
  });

  it('should run the script WITH error if the minor version is lower', function (done) {
    const lowerMinorVersion = requiredNodeVersionWithDiff(0, -1, 0);
    testValidateNodeVersion(
      done,
      lowerMinorVersion,
      REQUIRED_NODE_JS_VERSION !== lowerMinorVersion
    );
  });
});

function requiredNodeVersionWithDiff(majorDiff, minorDiff, patchDiff) {
  const matches = REQUIRED_NODE_JS_VERSION.match(/^v(\d+)\.(\d+)\.(\d+)/);
  const major = Math.max(parseInt(matches[1], 10) + majorDiff, 0);
  const minor = Math.max(parseInt(matches[2], 10) + minorDiff, 0);
  const patch = Math.max(parseInt(matches[3], 10) + patchDiff, 0);

  return `v${major}.${minor}.${patch}`;
}

function testValidateNodeVersion(done, versionToTest, expectError = false) {
  const processVersionOverwrite = `Object.defineProperty(process, 'version', { value: '${versionToTest}', writable: true });`;
  const command = `node -e "${processVersionOverwrite}require('./node_version_validator.js')"`;

  exec(command, { cwd: __dirname }, function (error, _stdout, stderr) {
    expect(stderr).toBeDefined();
    if (expectError) {
      expect(error.code).toBe(1);

      const speficicErrorMessage =
        `OpenSearch Dashboards was built with ${REQUIRED_NODE_JS_VERSION} and does not support the current Node.js version ${versionToTest}. ` +
        `Please use Node.js ${REQUIRED_NODE_JS_VERSION} or a higher patch version.\n`;

      expect(stderr).toStrictEqual(speficicErrorMessage);
    } else {
      expect(error).toBeNull();
      expect(stderr).toHaveLength(0);
    }
    done();
  });
}
