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

const plugins = [
  '@babel/plugin-transform-class-properties',
  '@babel/plugin-transform-private-methods',
  require.resolve('babel-plugin-add-module-exports'),

  // Optional Chaining proposal is stage 4 (https://github.com/tc39/proposal-optional-chaining)
  // Need this since we are using TypeScript 3.7+
  require.resolve('@babel/plugin-transform-optional-chaining'),
  // Nullish coalescing proposal is stage 4 (https://github.com/tc39/proposal-nullish-coalescing)
  // Need this since we are using TypeScript 3.7+
  require.resolve('@babel/plugin-transform-nullish-coalescing-operator'),

  // Proposal is merged into ECMA-262 (https://github.com/tc39/proposal-export-ns-from)
  // Need this since we are using TypeScript 3.8+
  require.resolve('@babel/plugin-transform-export-namespace-from'),

  // Proposal is on stage 4 (https://github.com/tc39/proposal-logical-assignment)
  require.resolve('@babel/plugin-transform-logical-assignment-operators'),
];

module.exports = {
  presets: [
    [require.resolve('@babel/preset-typescript'), { allowNamespaces: true }],
    require.resolve('@babel/preset-react'),
  ],
  plugins,
};
