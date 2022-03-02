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

import { CategoryKey } from '../../../../common/category';
import {
  Coordinate,
  Distance,
  Pixels,
  PointObject,
  PointTuple,
  PointTuples,
  Radian,
  SizeRatio,
} from '../../../../common/geometry';
import { Font, VerticalAlignments } from '../../../../common/text_utils';
import { GroupByAccessor } from '../../../../specs';
import { LegendPath } from '../../../../state/actions/legend';
import { Color } from '../../../../utils/common';
import { ContinuousDomainFocus } from '../../renderer/canvas/partition';
import { Layer } from '../../specs';
import { config, MODEL_KEY, ValueGetterName } from '../config';
import { ArrayNode, HierarchyOfArrays } from '../utils/group_by_rollup';
import { LinkLabelsViewModelSpec } from '../viewmodel/link_text_layout';
import { Config, PartitionLayout } from './config_types';

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
  clipText?: boolean;
}

/** @internal */
export interface SmallMultiplesDescriptors {
  smAccessorValue: ReturnType<GroupByAccessor>;
  index: number;
  innerIndex: number;
}

/** @internal */
export interface QuadViewModel extends ShapeTreeNode, SmallMultiplesDescriptors {
  strokeWidth: number;
  strokeStyle: string;
  fillColor: string;
  textColor: string;
}

/** @internal */
export interface OutsideLinksViewModel {
  points: Array<PointTuple>;
}

/** @internal */
export type PickFunction = (x: Pixels, y: Pixels, focus: ContinuousDomainFocus) => Array<QuadViewModel>;

/** @internal */
export interface PartitionSmallMultiplesModel extends SmallMultiplesDescriptors {
  panelTitle: string;
  smAccessorValue: number | string;
  partitionLayout: PartitionLayout;
  top: SizeRatio;
  left: SizeRatio;
  width: SizeRatio;
  height: SizeRatio;
  innerRowCount: number;
  innerColumnCount: number;
  innerRowIndex: number;
  innerColumnIndex: number;
  marginLeftPx: Pixels;
  marginTopPx: Pixels;
  panelInnerWidth: Pixels;
  panelInnerHeight: Pixels;
}

/** @internal */
export interface ShapeViewModel extends PartitionSmallMultiplesModel {
  config: Config;
  layers: Layer[];
  quadViewModel: QuadViewModel[];
  rowSets: RowSet[];
  linkLabelViewModels: LinkLabelsViewModelSpec;
  outsideLinksViewModel: OutsideLinksViewModel[];
  diskCenter: PointObject;
  pickQuads: PickFunction;
  outerRadius: number;
}

const defaultFont: Font = {
  fontStyle: 'normal',
  fontVariant: 'normal',
  fontFamily: '',
  fontWeight: 'normal',
  textColor: 'black',
  textOpacity: 1,
};

/** @internal */
export const nullPartitionSmallMultiplesModel = (partitionLayout: PartitionLayout): PartitionSmallMultiplesModel => ({
  index: 0,
  innerIndex: 0,
  smAccessorValue: '',
  panelTitle: '',
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  innerRowCount: 0,
  innerColumnCount: 0,
  innerRowIndex: 0,
  innerColumnIndex: 0,
  marginLeftPx: 0,
  marginTopPx: 0,
  panelInnerWidth: 0,
  panelInnerHeight: 0,
  partitionLayout,
});

/** @internal */
export const nullShapeViewModel = (specifiedConfig?: Config, diskCenter?: PointObject): ShapeViewModel => ({
  ...nullPartitionSmallMultiplesModel((specifiedConfig || config).partitionLayout),
  config: specifiedConfig || config,
  layers: [],
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

/** @public */
export type TreeLevel = number;

/** @public */
export interface AngleFromTo {
  x0: Radian;
  x1: Radian;
}

/** @internal */
export interface LayerFromTo {
  y0: TreeLevel;
  y1: TreeLevel;
}

/**
 * @public
 */
export interface TreeNode extends AngleFromTo {
  x0: Radian;
  x1: Radian;
  y0: TreeLevel;
  y1: TreeLevel;
  fill?: Color;
}

/**
 * @public
 */
export interface SectorGeomSpecY {
  y0px: Distance;
  y1px: Distance;
}

/** @public */
export type DataName = CategoryKey; // todo consider narrowing it to eg. primitives

/** @public */
export interface ShapeTreeNode extends TreeNode, SectorGeomSpecY {
  yMidPx: Distance;
  depth: number;
  sortIndex: number;
  path: LegendPath;
  dataName: DataName;
  value: number;
  [MODEL_KEY]: ArrayNode;
}

/** @public */
export type RawTextGetter = (node: ShapeTreeNode) => string;
/** @public */
export type ValueGetterFunction = (node: ShapeTreeNode) => number;
/** @public */
export type ValueGetter = ValueGetterFunction | ValueGetterName;
/** @public */
export type NodeColorAccessor = (d: ShapeTreeNode, index: number, array: HierarchyOfArrays) => string;
