import { Config } from './config_types';
import { Coordinate, Distance, PointObject, PointTuple, Radian } from './geometry_types';
import { Color, Font } from './types';
import { config } from '../config/config';
import { ArrayNode } from '../utils/group_by_rollup';

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

export type ShapeViewModel = {
  config: Config;
  quadViewModel: QuadViewModel[];
  rowSets: RowSet[];
  linkLabelViewModels: LinkLabelVM[];
  outsideLinksViewModel: OutsideLinksViewModel[];
  diskCenter: PointObject;
};

export const nullSectorViewModel = (): ShapeViewModel => ({
  config,
  quadViewModel: [],
  rowSets: [],
  linkLabelViewModels: [],
  outsideLinksViewModel: [],
  diskCenter: { x: 0, y: 0 },
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
export type ValueFormatter = (value: number) => string;
