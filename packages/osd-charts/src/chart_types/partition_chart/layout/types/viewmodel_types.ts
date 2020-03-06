/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { Config } from './config_types';
import { Coordinate, Distance, Pixels, PointObject, PointTuple, Radian } from './geometry_types';
import { Font } from './types';
import { config } from '../config/config';
import { ArrayNode, HierarchyOfArrays } from '../utils/group_by_rollup';
import { Color } from '../../../../utils/commons';

export type LinkLabelVM = {
  link: [PointTuple, ...PointTuple[]]; // at least one point
  translate: [number, number];
  textAlign: CanvasTextAlign;
  text: string;
  valueText: string;
  width: Distance;
  verticalOffset: Distance;
};

export interface RowBox extends Font {
  text: string;
  width: Distance;
  verticalOffset: Distance;
  wordBeginning: Distance;
}

interface RowCentroid {
  rowCentroidX: Coordinate;
  rowCentroidY: Coordinate;
}

export interface RowSpace extends RowCentroid {
  maximumRowLength: Distance;
}

export interface TextRow extends RowCentroid {
  length: number;
  maximumLength: number;
  rowWords: Array<RowBox>;
}

export interface RowSet {
  id: string;
  rows: Array<TextRow>;
  fillTextColor: string;
  fontSize: number;
  rotation: Radian;
}

export interface QuadViewModel extends ShapeTreeNode {
  strokeWidth: number;
  fillColor: string;
}

export interface OutsideLinksViewModel {
  points: Array<PointTuple>;
}

export type PickFunction = (x: Pixels, y: Pixels) => Array<QuadViewModel>;

export type ShapeViewModel = {
  config: Config;
  quadViewModel: QuadViewModel[];
  rowSets: RowSet[];
  linkLabelViewModels: LinkLabelVM[];
  outsideLinksViewModel: OutsideLinksViewModel[];
  diskCenter: PointObject;
  pickQuads: PickFunction;
};

export const nullShapeViewModel = (specifiedConfig?: Config, diskCenter?: PointObject): ShapeViewModel => ({
  config: specifiedConfig || config,
  quadViewModel: [],
  rowSets: [],
  linkLabelViewModels: [],
  outsideLinksViewModel: [],
  diskCenter: diskCenter || { x: 0, y: 0 },
  pickQuads: () => [],
});

type TreeLevel = number;

interface AngleFromTo {
  x0: Radian;
  x1: Radian;
}

export interface TreeNode extends AngleFromTo {
  x0: Radian;
  x1: Radian;
  y0: TreeLevel;
  y1: TreeLevel;
  fill?: Color;
}

interface SectorGeomSpecY {
  y0px: Distance;
  y1px: Distance;
}

export interface ShapeTreeNode extends TreeNode, SectorGeomSpecY {
  yMidPx: Distance;
  depth: number;
  sortIndex: number;
  dataName: any;
  value: number;
  parent: ArrayNode;
}

export type RawTextGetter = (node: ShapeTreeNode) => string;
export type NodeColorAccessor = (d: ShapeTreeNode, index: number, array: HierarchyOfArrays) => string;
