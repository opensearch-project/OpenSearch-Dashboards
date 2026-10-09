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

if (process.noProcessWarnings !== true) {
  var ignore = [
    'MaxListenersExceededWarning',
    'NodeDeprecationWarning',
    // Emitted by Node.js >=20.10 when a `.js` file is resolved as ESM from a
    // `package.json` that declares no `type` field. Advisory only.
    'MODULE_TYPELESS_PACKAGE_JSON',
    // DEP0180, added in Node.js 22. Arrives with `name` of `DeprecationWarning`,
    // so it can only be matched on its message.
    'fs.Stats constructor is deprecated.',
  ];

  process.on('warning', function (warn) {
    // Warnings are matched on all three fields because Node.js is inconsistent
    // about where the identifying string lands: `name` for the historical
    // entries above, `code` for `MODULE_TYPELESS_PACKAGE_JSON`, and `message`
    // for deprecations, which all share the generic `DeprecationWarning` name.
    if (ignore.includes(warn.name) || ignore.includes(warn.code) || ignore.includes(warn.message))
      return;

    if (process.traceProcessWarnings === true) {
      console.error('Node.js process-warning detected - Terminating process...');
    } else {
      console.error('Node.js process-warning detected:');
      console.error();
      console.error(warn.stack);
      console.error();
      console.error('Terminating process...');
    }

    process.exit(1);
  });

  // While the above warning listener would also be called on
  // unhandledRejection warnings, we can give a better error message if we
  // handle them separately:
  process.on('unhandledRejection', function (reason) {
    console.error('Unhandled Promise rejection detected:');
    console.error();
    console.error(reason);
    console.error();
    console.error('Terminating process...');
    process.exit(1);
  });
}
