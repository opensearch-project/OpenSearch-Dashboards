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

var exec = require('child_process').exec;
var pkg = require('../../package.json');

var REQUIRED_NODE_JS_VERSION = 'v' + pkg.engines.node;

describe('NodeVersionValidator', function () {
  it('should run the script WITHOUT error when the version is the same', function (done) {
    test_validate_node_version(done, REQUIRED_NODE_JS_VERSION, false);
  });

  it('should run the script WITHOUT error when only the patch version is higher', function (done) {
    test_validate_node_version(done, required_node_version_with_diff(0,0,+1), false);
  });

  it('should run the script WITHOUT error when only the patch version is lower', function (done) {
    test_validate_node_version(done, required_node_version_with_diff(0,0,-1), false);
  });

  it('should run the script WITH error if the major version is higher', function (done) {
    test_validate_node_version(done, required_node_version_with_diff(+1,0,0), true);
  });

  it('should run the script WITH error if the major version is lower', function (done) {
    test_validate_node_version(done, required_node_version_with_diff(-1,0,0), true);
  });

  it('should run the script WITH error if the minor version is higher', function (done) {
    test_validate_node_version(done, required_node_version_with_diff(0,+1,0), true);
  });

  it('should run the script WITH error if the minor version is lower', function (done) {
    test_validate_node_version(done, required_node_version_with_diff(0,-1,0), true);
  });
});

function required_node_version_with_diff(major_diff, minor_diff, patch_diff) {
  var matches = REQUIRED_NODE_JS_VERSION.match(/^v(\d+)\.(\d+)\.(\d+)/);
  var major = parseInt(matches[1]) + major_diff;
  var minor = parseInt(matches[2]) + minor_diff;
  var patch = parseInt(matches[3]) + patch_diff;

  return `v${major}.${minor}.${patch}`;
}

function test_validate_node_version(done, version, expected_error) {
  var processVersionOverwrite = `Object.defineProperty(process, 'version', { value: '${version}', writable: true });`;
  var command = `node -e "${processVersionOverwrite}require('./node_version_validator.js')"`;

  exec(command, { cwd: __dirname }, function (error, _stdout, stderr) {
    expect(stderr).toBeDefined();
    if (expected_error) {
      expect(error.code).toBe(1);
      expect(stderr).not.toHaveLength(0);
    } else {
      expect(error).toBeNull();
      expect(stderr).toHaveLength(0);
    }
    done();
  });
}

