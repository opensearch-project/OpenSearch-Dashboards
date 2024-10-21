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

import { OsdFieldType } from './osd_field_type';
import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES } from './types';

export const OsdFieldTypeUnknown = new OsdFieldType({
  name: OSD_FIELD_TYPES.UNKNOWN,
});

export const createOsdFieldTypes = (): OsdFieldType[] => [
  new OsdFieldType({
    name: OSD_FIELD_TYPES.STRING,
    sortable: true,
    filterable: true,
    esTypes: [
      OPENSEARCH_FIELD_TYPES.STRING,
      OPENSEARCH_FIELD_TYPES.TEXT,
      OPENSEARCH_FIELD_TYPES.KEYWORD,
      OPENSEARCH_FIELD_TYPES._TYPE,
      OPENSEARCH_FIELD_TYPES._ID,
    ],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.NUMBER,
    sortable: true,
    filterable: true,
    esTypes: [
      OPENSEARCH_FIELD_TYPES.FLOAT,
      OPENSEARCH_FIELD_TYPES.HALF_FLOAT,
      OPENSEARCH_FIELD_TYPES.SCALED_FLOAT,
      OPENSEARCH_FIELD_TYPES.DOUBLE,
      OPENSEARCH_FIELD_TYPES.INTEGER,
      OPENSEARCH_FIELD_TYPES.LONG,
      OPENSEARCH_FIELD_TYPES.UNSIGNED_LONG,
      OPENSEARCH_FIELD_TYPES.SHORT,
      OPENSEARCH_FIELD_TYPES.BYTE,
      OPENSEARCH_FIELD_TYPES.TOKEN_COUNT,
    ],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.DATE,
    sortable: true,
    filterable: true,
    esTypes: [OPENSEARCH_FIELD_TYPES.DATE, OPENSEARCH_FIELD_TYPES.DATE_NANOS],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.IP,
    sortable: true,
    filterable: true,
    esTypes: [OPENSEARCH_FIELD_TYPES.IP],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.BOOLEAN,
    sortable: true,
    filterable: true,
    esTypes: [OPENSEARCH_FIELD_TYPES.BOOLEAN],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.OBJECT,
    esTypes: [OPENSEARCH_FIELD_TYPES.OBJECT],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.NESTED,
    esTypes: [OPENSEARCH_FIELD_TYPES.NESTED],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.GEO_POINT,
    esTypes: [OPENSEARCH_FIELD_TYPES.GEO_POINT],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.GEO_SHAPE,
    esTypes: [OPENSEARCH_FIELD_TYPES.GEO_SHAPE],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.ATTACHMENT,
    esTypes: [OPENSEARCH_FIELD_TYPES.ATTACHMENT],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.MURMUR3,
    esTypes: [OPENSEARCH_FIELD_TYPES.MURMUR3],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES._SOURCE,
    esTypes: [OPENSEARCH_FIELD_TYPES._SOURCE],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.HISTOGRAM,
    filterable: true,
    esTypes: [OPENSEARCH_FIELD_TYPES.HISTOGRAM],
  }),
  new OsdFieldType({
    name: OSD_FIELD_TYPES.CONFLICT,
  }),
  OsdFieldTypeUnknown,
];
