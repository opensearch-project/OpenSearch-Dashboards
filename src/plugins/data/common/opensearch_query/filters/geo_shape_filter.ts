/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoShapeRelation } from '@opensearch-project/opensearch/api/types';
import { Filter, FilterMeta } from './meta_filter';

export type Position = number[];

export interface PreIndexedShapeFilter {
  index: string;
  id: string;
  path: string;
  routing?: string;
}

export interface Polygon {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

// TODO: support other geometries too.
export type ShapeFilter = Polygon | MultiPolygon;

export type GeoShapeFilterMeta = FilterMeta & {
  params: {
    shape?: ShapeFilter;
    indexed_shape?: PreIndexedShapeFilter;
    relation?: GeoShapeRelation;
  };
};

export type GeoShapeFilter = Filter & {
  meta: GeoShapeFilterMeta;
  geo_shape: any;
};

export const isGeoShapeFilter = (filter: any): filter is GeoShapeFilter => filter?.geo_shape;

export const getGeoShapeFilterField = (filter: GeoShapeFilter): string | undefined => {
  if (filter?.geo_shape === undefined) {
    return undefined;
  }
  return (
    filter?.geo_shape && Object.keys(filter.geo_shape).find((key) => key !== 'ignore_unmapped')
  );
};
