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
 * under the License.
 */

import { Color } from '../../../../utils/commons';
import { config, ValueGetterName } from '../config/config';
import { ArrayNode, HierarchyOfArrays } from '../utils/group_by_rollup';
import { VerticalAlignments } from '../viewmodel/constants';
import { LinkLabelsViewModelSpec } from '../viewmodel/link_text_layout';
import { Config } from './config_types';
import { Coordinate, Distance, Pixels, PointObject, PointTuple, PointTuples, Radian } from './geometry_types';
import { Font } from './types';

/** @internal */
export type LinkLabelVM = {
  linkLabels: PointTuples;
  translate: PointTuple;
  textAlign: CanvasTextAlign;
  text: string;
  valueText: string;
  width: Distance;
  valueWidth: Distance;
  verticalOffset: Distance;
};

/** @internal */
export interface RowBox extends Font {
  text: string;
  width: Distance;
  verticalOffset: Distance;
  wordBeginning: Distance;
}

interface RowAnchor {
  rowAnchorX: Coordinate;
  rowAnchorY: Coordinate;
}

/** @internal */
export interface RowSpace extends RowAnchor {
  maximumRowLength: Distance;
}

/** @internal */
export interface TextRow extends RowAnchor {
  length: number;
  maximumLength: number;
  rowWords: Array<RowBox>;
}

/** @internal */
export interface RowSet {
  id: string;
  rows: Array<TextRow>;
  fillTextColor?: string;
  fontSize: number;
  rotation: Radian;
  verticalAlignment: VerticalAlignments;
  leftAlign: boolean; // might be generalized into horizontalAlign - if needed
  container?: any;
}

/** @internal */
export interface QuadViewModel extends ShapeTreeNode {
  strokeWidth: number;
  strokeStyle: string;
  fillColor: string;
}

/** @internal */
export interface OutsideLinksViewModel {
  points: Array<PointTuple>;
}

/** @internal */
export type PickFunction = (x: Pixels, y: Pixels) => Array<QuadViewModel>;

/** @internal */
export type ShapeViewModel = {
  config: Config;
  quadViewModel: QuadViewModel[];
  rowSets: RowSet[];
  linkLabelViewModels: LinkLabelsViewModelSpec;
  outsideLinksViewModel: OutsideLinksViewModel[];
  diskCenter: PointObject;
  pickQuads: PickFunction;
  outerRadius: number;
};

const defaultFont: Font = {
  fontStyle: 'normal',
  fontVariant: 'normal',
  fontFamily: '',
  fontWeight: 'normal',
  textColor: 'black',
  textOpacity: 1,
};

/** @internal */
export const nullShapeViewModel = (specifiedConfig?: Config, diskCenter?: PointObject): ShapeViewModel => ({
  config: specifiedConfig || config,
  quadViewModel: [],
  rowSets: [],
  linkLabelViewModels: {
    linkLabels: [],
    labelFontSpec: defaultFont,
    valueFontSpec: defaultFont,
    strokeColor: '',
  },
  outsideLinksViewModel: [],
  diskCenter: diskCenter || { x: 0, y: 0 },
  pickQuads: () => [],
  outerRadius: 0,
});

type TreeLevel = number;

interface AngleFromTo {
  x0: Radian;
  x1: Radian;
}

interface TreeNode extends AngleFromTo {
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

export type DataName = any; // todo consider narrowing it to eg. primitives

export interface ShapeTreeNode extends TreeNode, SectorGeomSpecY {
  yMidPx: Distance;
  depth: number;
  sortIndex: number;
  path: number[];
  dataName: DataName;
  value: number;
  parent: ArrayNode;
}

export type RawTextGetter = (node: ShapeTreeNode) => string;
export type ValueGetterFunction = (node: ShapeTreeNode) => number;
export type ValueGetter = ValueGetterFunction | ValueGetterName;
export type NodeColorAccessor = (d: ShapeTreeNode, index: number, array: HierarchyOfArrays) => string;
