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

import { resolve } from 'path';

export const CA_CERT_PATH = resolve(__dirname, '../certs/ca.crt');
export const OPENSEARCH_KEY_PATH = resolve(__dirname, '../certs/opensearch.key');
export const OPENSEARCH_CERT_PATH = resolve(__dirname, '../certs/opensearch.crt');
export const OPENSEARCH_P12_PATH = resolve(__dirname, '../certs/opensearch.p12');
export const OPENSEARCH_P12_PASSWORD = 'storepass';
export const OPENSEARCH_EMPTYPASSWORD_P12_PATH = resolve(
  __dirname,
  '../certs/opensearch_emptypassword.p12'
);
export const OPENSEARCH_NOPASSWORD_P12_PATH = resolve(
  __dirname,
  '../certs/opensearch_nopassword.p12'
);
export const OSD_KEY_PATH = resolve(__dirname, '../certs/opensearch_dashboards.key');
export const OSD_CERT_PATH = resolve(__dirname, '../certs/opensearch_dashboards.crt');
export const OSD_P12_PATH = resolve(__dirname, '../certs/opensearch_dashboards.p12');
export const OSD_P12_PASSWORD = 'storepass';
