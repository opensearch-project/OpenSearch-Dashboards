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

// @ts-expect-error
import stubbedLogstashFields from './logstash_fields';

const mockLogstashFields = stubbedLogstashFields();

export function stubbedSavedObjectIndexPattern(id: string | null = null, withDataSource?: false) {
  const indexPattern: any = {
    id,
    type: 'index-pattern',
    attributes: {
      timeFieldName: 'timestamp',
      customFormats: {},
      fields: mockLogstashFields,
      title: 'title',
    },
    version: '2',
  };

  if (withDataSource) {
    indexPattern.reference = [
      {
        id: 'id',
        name: 'name',
        type: 'data-source',
      },
    ];
  }

  return indexPattern;
}
