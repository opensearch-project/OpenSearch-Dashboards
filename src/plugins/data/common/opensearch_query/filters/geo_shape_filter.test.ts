/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoShapeFilter, getGeoShapeFilterField, Polygon, ShapeFilter } from './geo_shape_filter';
import { GeoShapeRelation } from '@opensearch-project/opensearch/api/types';

describe('geo shape filter', function () {
  describe('getGeoShapeFilterField', function () {
    it('should return the name of the field a geo_shape query is targeting', () => {
      const polygon: Polygon = {
        coordinates: [
          [
            [74.006, 40.7128],
            [71.0589, 42.3601],
            [73.7562, 42.6526],
            [74.006, 40.7128],
          ],
          [
            [72.6734, 41.7658],
            [72.6506, 41.5623],
            [73.0515, 41.5582],
            [72.6734, 41.7658],
          ],
        ],
        type: 'Polygon',
      };
      const geoShapeQuery: {
        shape: ShapeFilter;
        relation: GeoShapeRelation;
      } = {
        shape: polygon,
        relation: 'intersects',
      };
      const filter: GeoShapeFilter = {
        geo_shape: {
          geoPointField: geoShapeQuery,
          ignore_unmapped: true,
        },
        meta: {
          disabled: false,
          negate: false,
          alias: null,
          params: geoShapeQuery,
        },
      };
      const result = getGeoShapeFilterField(filter);
      expect(result).toBe('geoPointField');
    });
    it('should return undefined if filter.geo_shape is undefined', () => {
      const filter: GeoShapeFilter = {
        geo_shape: undefined,
        meta: {
          disabled: false,
          negate: false,
          alias: null,
          params: {
            shape: undefined,
          },
        },
      };
      const result = getGeoShapeFilterField(filter);
      expect(result).toBeUndefined();
    });
  });
});
