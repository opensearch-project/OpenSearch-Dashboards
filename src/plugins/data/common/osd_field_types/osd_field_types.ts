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
import { createOsdFieldTypes, OsdFieldTypeUnknown } from './osd_field_types_factory';
import { OPENSEARCH_FIELD_TYPES, OPENSEARCH_SQL_TYPES, OSD_FIELD_TYPES } from './types';

/** @private */
const registeredOsdTypes = createOsdFieldTypes();
let osdFieldOverrides = {};

/**
 *  Get a type object by name
 *
 *  @param  {string} typeName
 *  @return {OsdFieldType}
 */
export const getOsdFieldType = (typeName: string): OsdFieldType =>
  registeredOsdTypes.find((t) => t.name === typeName) || OsdFieldTypeUnknown;

/**
 *  Get the esTypes known by all osdFieldTypes
 *
 *  @return {Array<string>}
 */
export const getOsdTypeNames = (): string[] =>
  registeredOsdTypes.filter((type) => type.name).map((type) => type.name);

/**
 *  Get the OsdFieldType name for an opensearchType string
 *
 *  @param {string} opensearchType
 *  @return {string}
 */
export const castOpenSearchToOsdFieldTypeName = (
  opensearchType: OPENSEARCH_FIELD_TYPES | string
): OSD_FIELD_TYPES => {
  const type = registeredOsdTypes.find((t) =>
    t.esTypes.includes(opensearchType as OPENSEARCH_FIELD_TYPES)
  );

  return type && type.name ? (type.name as OSD_FIELD_TYPES) : OSD_FIELD_TYPES.UNKNOWN;
};

/**
 *  Get filterable osdFieldTypes
 *
 *  @return {Array<string>}
 */
export const getFilterableOsdTypeNames = (): string[] =>
  registeredOsdTypes.filter((type) => type.filterable).map((type) => type.name);

export const setOsdFieldOverrides = (newOverrides: { [key: string]: any } | undefined) => {
  osdFieldOverrides = newOverrides ? Object.assign({}, osdFieldOverrides, newOverrides) : {};
};

export const getOsdFieldOverrides = (): { [key: string]: any } => {
  return osdFieldOverrides;
};

/**
 *  Mapping function from SQL_TYPES to OSD_FIELD_TYPES
 *
 *  @param {OPENSEARCH_SQL_TYPES} sqlType
 *  @return {OSD_FIELD_TYPES}
 */
export function castSQLTypeToOSDFieldType(sqlType: OPENSEARCH_SQL_TYPES): OSD_FIELD_TYPES {
  switch (sqlType) {
    case OPENSEARCH_SQL_TYPES.BOOLEAN:
      return OSD_FIELD_TYPES.BOOLEAN;
    case OPENSEARCH_SQL_TYPES.BYTE:
    case OPENSEARCH_SQL_TYPES.SHORT:
    case OPENSEARCH_SQL_TYPES.INTEGER:
    case OPENSEARCH_SQL_TYPES.LONG:
    case OPENSEARCH_SQL_TYPES.FLOAT:
    case OPENSEARCH_SQL_TYPES.DOUBLE:
      return OSD_FIELD_TYPES.NUMBER;
    case OPENSEARCH_SQL_TYPES.KEYWORD:
    case OPENSEARCH_SQL_TYPES.TEXT:
      return OSD_FIELD_TYPES.STRING;
    case OPENSEARCH_SQL_TYPES.TIMESTAMP:
    case OPENSEARCH_SQL_TYPES.DATE:
    case OPENSEARCH_SQL_TYPES.DATE_NANOS:
    case OPENSEARCH_SQL_TYPES.TIME:
    case OPENSEARCH_SQL_TYPES.INTERVAL:
      return OSD_FIELD_TYPES.DATE;
    case OPENSEARCH_SQL_TYPES.IP:
      return OSD_FIELD_TYPES.IP;
    case OPENSEARCH_SQL_TYPES.GEO_POINT:
      return OSD_FIELD_TYPES.GEO_POINT;
    case OPENSEARCH_SQL_TYPES.BINARY:
      return OSD_FIELD_TYPES.ATTACHMENT;
    case OPENSEARCH_SQL_TYPES.STRUCT:
    case OPENSEARCH_SQL_TYPES.ARRAY:
      return OSD_FIELD_TYPES.OBJECT;
    default:
      return OSD_FIELD_TYPES.UNKNOWN;
  }
}
