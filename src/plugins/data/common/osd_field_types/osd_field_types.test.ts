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

import {
  castOpenSearchToOsdFieldTypeName,
  castSQLTypeToOSDFieldType,
  getOsdFieldType,
  getOsdTypeNames,
  OsdFieldType,
} from '.';

import { OPENSEARCH_FIELD_TYPES, OPENSEARCH_SQL_FIELD_TYPES, OSD_FIELD_TYPES } from './types';

describe('utils/osd_field_types', () => {
  describe('OsdFieldType', () => {
    test('defaults', () => {
      const osdFieldType = new OsdFieldType({});

      expect(osdFieldType).toHaveProperty('name', OSD_FIELD_TYPES.UNKNOWN);
      expect(osdFieldType).toHaveProperty('sortable', false);
      expect(osdFieldType).toHaveProperty('filterable', false);
      expect(osdFieldType.esTypes).toEqual([]);
    });

    test('assigns name, sortable, filterable, and esTypes options to itself', () => {
      const name = 'name';
      const sortable = true;
      const filterable = true;
      const esTypes = [
        OPENSEARCH_FIELD_TYPES.LONG,
        OPENSEARCH_FIELD_TYPES.BYTE,
        OPENSEARCH_FIELD_TYPES.DATE,
      ];

      const osdFieldType = new OsdFieldType({ name, sortable, filterable, esTypes });

      expect(osdFieldType).toHaveProperty('name', name);
      expect(osdFieldType).toHaveProperty('sortable', sortable);
      expect(osdFieldType).toHaveProperty('filterable', filterable);
      expect(osdFieldType.esTypes).toEqual(esTypes);
    });
  });

  describe('getOsdFieldType()', () => {
    test('returns a OsdFieldType instance by name', () => {
      const osdFieldType = getOsdFieldType(OPENSEARCH_FIELD_TYPES.STRING);

      expect(osdFieldType).toBeInstanceOf(OsdFieldType);
      expect(osdFieldType).toHaveProperty('name', OPENSEARCH_FIELD_TYPES.STRING);
    });

    test('returns unknown for invalid name', () => {
      const osdFieldType = getOsdFieldType('wrongType');

      expect(osdFieldType).toHaveProperty('name', OSD_FIELD_TYPES.UNKNOWN);
    });
  });

  describe('castOpenSearchToOsdFieldTypeName()', () => {
    test('returns the OsdFieldType name that matches the opensearchType', () => {
      expect(castOpenSearchToOsdFieldTypeName(OPENSEARCH_FIELD_TYPES.KEYWORD)).toBe('string');
      expect(castOpenSearchToOsdFieldTypeName(OPENSEARCH_FIELD_TYPES.FLOAT)).toBe('number');
      expect(castOpenSearchToOsdFieldTypeName(OPENSEARCH_FIELD_TYPES.UNSIGNED_LONG)).toBe('number');
    });

    test('returns unknown for unknown opensearch types', () => {
      const castTo = castOpenSearchToOsdFieldTypeName('wrongType' as OPENSEARCH_FIELD_TYPES);

      expect(castTo).toBe('unknown');
    });
  });

  describe('getOsdTypeNames()', () => {
    test('returns a list of all OsdFieldType names', () => {
      const osdTypeNames = getOsdTypeNames().sort();

      expect(osdTypeNames).toEqual([
        OSD_FIELD_TYPES._SOURCE,
        OSD_FIELD_TYPES.ATTACHMENT,
        OSD_FIELD_TYPES.BOOLEAN,
        OSD_FIELD_TYPES.CONFLICT,
        OSD_FIELD_TYPES.DATE,
        OSD_FIELD_TYPES.GEO_POINT,
        OSD_FIELD_TYPES.GEO_SHAPE,
        OSD_FIELD_TYPES.HISTOGRAM,
        OSD_FIELD_TYPES.IP,
        OSD_FIELD_TYPES.MURMUR3,
        OSD_FIELD_TYPES.NESTED,
        OSD_FIELD_TYPES.NUMBER,
        OSD_FIELD_TYPES.OBJECT,
        OSD_FIELD_TYPES.STRING,
        OSD_FIELD_TYPES.UNKNOWN,
      ]);
    });
  });

  describe('castSQLTypeToOSDFieldType()', () => {
    it('should map BOOLEAN to OSD_FIELD_TYPES.BOOLEAN', () => {
      expect(castSQLTypeToOSDFieldType(OPENSEARCH_SQL_FIELD_TYPES.BOOLEAN)).toBe(
        OSD_FIELD_TYPES.BOOLEAN
      );
    });

    it('should map BYTE, SHORT, INTEGER, INT, LONG, FLOAT, DOUBLE to OSD_FIELD_TYPES.NUMBER', () => {
      const numberTypes = [
        OPENSEARCH_SQL_FIELD_TYPES.BYTE,
        OPENSEARCH_SQL_FIELD_TYPES.SHORT,
        OPENSEARCH_SQL_FIELD_TYPES.INTEGER,
        OPENSEARCH_SQL_FIELD_TYPES.INT,
        OPENSEARCH_SQL_FIELD_TYPES.LONG,
        OPENSEARCH_SQL_FIELD_TYPES.FLOAT,
        OPENSEARCH_SQL_FIELD_TYPES.DOUBLE,
      ];
      numberTypes.forEach((type) => {
        expect(castSQLTypeToOSDFieldType(type)).toBe(OSD_FIELD_TYPES.NUMBER);
      });
    });

    it('should map KEYWORD, TEXT, STRING to OSD_FIELD_TYPES.STRING', () => {
      const stringTypes = [
        OPENSEARCH_SQL_FIELD_TYPES.KEYWORD,
        OPENSEARCH_SQL_FIELD_TYPES.TEXT,
        OPENSEARCH_SQL_FIELD_TYPES.STRING,
      ];
      stringTypes.forEach((type) => {
        expect(castSQLTypeToOSDFieldType(type)).toBe(OSD_FIELD_TYPES.STRING);
      });
    });

    it('should map TIMESTAMP, DATE, DATE_NANOS, TIME, INTERVAL to OSD_FIELD_TYPES.DATE', () => {
      const dateTypes = [
        OPENSEARCH_SQL_FIELD_TYPES.TIMESTAMP,
        OPENSEARCH_SQL_FIELD_TYPES.DATE,
        OPENSEARCH_SQL_FIELD_TYPES.DATE_NANOS,
        OPENSEARCH_SQL_FIELD_TYPES.TIME,
        OPENSEARCH_SQL_FIELD_TYPES.INTERVAL,
      ];
      dateTypes.forEach((type) => {
        expect(castSQLTypeToOSDFieldType(type)).toBe(OSD_FIELD_TYPES.DATE);
      });
    });

    it('should map IP to OSD_FIELD_TYPES.IP', () => {
      expect(castSQLTypeToOSDFieldType(OPENSEARCH_SQL_FIELD_TYPES.IP)).toBe(OSD_FIELD_TYPES.IP);
    });

    it('should map GEO_POINT to OSD_FIELD_TYPES.GEO_POINT', () => {
      expect(castSQLTypeToOSDFieldType(OPENSEARCH_SQL_FIELD_TYPES.GEO_POINT)).toBe(
        OSD_FIELD_TYPES.GEO_POINT
      );
    });

    it('should map BINARY to OSD_FIELD_TYPES.ATTACHMENT', () => {
      expect(castSQLTypeToOSDFieldType(OPENSEARCH_SQL_FIELD_TYPES.BINARY)).toBe(
        OSD_FIELD_TYPES.ATTACHMENT
      );
    });

    it('should map STRUCT and ARRAY to OSD_FIELD_TYPES.OBJECT', () => {
      const objectTypes = [OPENSEARCH_SQL_FIELD_TYPES.STRUCT, OPENSEARCH_SQL_FIELD_TYPES.ARRAY];
      objectTypes.forEach((type) => {
        expect(castSQLTypeToOSDFieldType(type)).toBe(OSD_FIELD_TYPES.OBJECT);
      });
    });

    it('should return OSD_FIELD_TYPES.UNKNOWN for unmapped types', () => {
      expect(castSQLTypeToOSDFieldType(OPENSEARCH_SQL_FIELD_TYPES.UNKNOWN)).toBe(
        OSD_FIELD_TYPES.UNKNOWN
      );
    });
  });
});
