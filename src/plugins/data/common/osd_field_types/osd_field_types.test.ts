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

import { castOpenSearchToOsdFieldTypeName, getOsdFieldType, getOsdTypeNames, OsdFieldType } from '.';

import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES } from './types';

describe('utils/osd_field_types', () => {
  describe('OsdFieldType', () => {
    test('defaults', () => {
      const OsdFieldType = new OsdFieldType({});

      expect(OsdFieldType).toHaveProperty('name', OSD_FIELD_TYPES.UNKNOWN);
      expect(OsdFieldType).toHaveProperty('sortable', false);
      expect(OsdFieldType).toHaveProperty('filterable', false);
      expect(OsdFieldType.opensearchTypes).toEqual([]);
    });

    test('assigns name, sortable, filterable, and opensearchTypes options to itself', () => {
      const name = 'name';
      const sortable = true;
      const filterable = true;
      const opensearchTypes = [OPENSEARCH_FIELD_TYPES.LONG, OPENSEARCH_FIELD_TYPES.BYTE, OPENSEARCH_FIELD_TYPES.DATE];

      const OsdFieldType = new OsdFieldType({ name, sortable, filterable, opensearchTypes });

      expect(OsdFieldType).toHaveProperty('name', name);
      expect(OsdFieldType).toHaveProperty('sortable', sortable);
      expect(OsdFieldType).toHaveProperty('filterable', filterable);
      expect(OsdFieldType.opensearchTypes).toEqual(opensearchTypes);
    });
  });

  describe('getOsdFieldType()', () => {
    test('returns a OsdFieldType instance by name', () => {
      const OsdFieldType = getOsdFieldType(OPENSEARCH_FIELD_TYPES.STRING);

      expect(OsdFieldType).toBeInstanceOf(OsdFieldType);
      expect(OsdFieldType).toHaveProperty('name', OPENSEARCH_FIELD_TYPES.STRING);
    });

    test('returns unknown for invalid name', () => {
      const OsdFieldType = getOsdFieldType('wrongType');

      expect(OsdFieldType).toHaveProperty('name', OSD_FIELD_TYPES.UNKNOWN);
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
});
