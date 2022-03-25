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

import { MakeSchemaFrom } from 'src/plugins/usage_collection/server';
import { LicenseUsage, StaticTelemetryUsage } from './telemetry_usage_collector';

const licenseSchema: MakeSchemaFrom<LicenseUsage> = {
  uuid: { type: 'keyword' },
  type: { type: 'keyword' },
  issued_to: { type: 'text' },
  issuer: { type: 'text' },
  issue_date_in_millis: { type: 'long' },
  start_date_in_millis: { type: 'long' },
  expiry_date_in_millis: { type: 'long' },
  max_resource_units: { type: 'long' },
};

export const staticTelemetrySchema: MakeSchemaFrom<StaticTelemetryUsage> = {
  opensearchce: {
    osd_uuid: { type: 'keyword' },
    opensearch_uuid: { type: 'keyword' },
    account_id: { type: 'keyword' },
    license: licenseSchema,
  },
  opensearchs: {
    osd_uuid: { type: 'keyword' },
    opensearch_uuid: { type: 'keyword' },
    account_id: { type: 'keyword' },
    license: licenseSchema,
  },
  opensearchck: {
    operator_uuid: { type: 'keyword' },
    operator_roles: { type: 'keyword' },
    custom_operator_namespace: { type: 'boolean' },
    distribution: { type: 'text' },
    build: {
      hash: { type: 'text' },
      date: { type: 'date' },
      version: { type: 'keyword' },
    },
  },
};
