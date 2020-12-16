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

import { StrokeStyle, ValueFormatter, Color } from '../../../../utils/commons';
import { Layer } from '../../specs';
import { percentValueGetter } from '../config/config';
import { meanAngle } from '../geometry';
import { Config, PartitionLayout } from '../types/config_types';
import { Distance, Pixels, PointTuple, Radius } from '../types/geometry_types';
import { TextMeasure, Part } from '../types/types';
import {
  nullShapeViewModel,
  OutsideLinksViewModel,
  PickFunction,
  QuadViewModel,
  RawTextGetter,
  RowSet,
  ShapeTreeNode,
  ShapeViewModel,
  ValueGetterFunction,
} from '../types/viewmodel_types';
import { argsToRGBString, stringToRGB } from '../utils/color_library_wrappers';
import { TAU } from '../utils/constants';
import {
  aggregateAccessor,
  ArrayEntry,
  depthAccessor,
  entryKey,
  entryValue,
  mapEntryValue,
  parentAccessor,
  sortIndexAccessor,
  HierarchyOfArrays,
  pathAccessor,
} from '../utils/group_by_rollup';
import { trueBearingToStandardPositionAngle } from '../utils/math';
import { sunburst } from '../utils/sunburst';
import { getTopPadding, treemap } from '../utils/treemap';
import {
  fillTextLayout,
  getRectangleRowGeometry,
  ringSectorConstruction,
  getSectorRowGeometry,
  inSectorRotation,
  nodeId,
} from './fill_text_layout';
import { linkTextLayout } from './link_text_layout';

function grooveAccessor(n: ArrayEntry) {
  return entryValue(n).depth > 1 ? 1 : [0, 2][entryValue(n).depth];
}

function topGrooveAccessor(topGroovePx: Pixels) {
  return (n: ArrayEntry) => (entryValue(n).depth > 0 ? topGroovePx : grooveAccessor(n));
}

function rectangleFillOrigins(n: ShapeTreeNode): PointTuple {
  return [(n.x0 + n.x1) / 2, (n.y0 + n.y1) / 2];
}
export const ringSectorInnerRadius = (n: ShapeTreeNode): Radius => n.y0px;

export const ringSectorOuterRadius = (n: ShapeTreeNode): Radius => n.y1px;

export const ringSectorMiddleRadius = (n: ShapeTreeNode): Radius => n.yMidPx;

function sectorFillOrigins(fillOutside: boolean) {
  return (node: ShapeTreeNode): [number, number] => {
    const midAngle = (node.x0 + node.x1) / 2;
    const divider = 10;
    const innerBias = fillOutside ? 9 : 1;
    const outerBias = divider - innerBias;
    const radius = (innerBias * ringSectorInnerRadius(node) + outerBias * ringSectorOuterRadius(node)) / divider;
    const cx = Math.cos(trueBearingToStandardPositionAngle(midAngle)) * radius;
    const cy = Math.sin(trueBearingToStandardPositionAngle(midAngle)) * radius;
    return [cx, cy];
  };
}

/** @internal */
export function makeQuadViewModel(
  childNodes: ShapeTreeNode[],
  layers: Layer[],
  sectorLineWidth: Pixels,
  sectorLineStroke: StrokeStyle,
): Array<QuadViewModel> {
  return childNodes.map((node) => {
    const opacityMultiplier = 1; // could alter in the future, eg. in response to interactions
    const layer = layers[node.depth - 1];
    const fillColorSpec = layer && layer.shape && layer.shape.fillColor;
    const fill = fillColorSpec || 'rgba(128,0,0,0.5)';
    const shapeFillColor = typeof fill === 'function' ? fill(node, node.sortIndex, node.parent.children) : fill;
    const { r, g, b, opacity } = stringToRGB(shapeFillColor);
    const fillColor = argsToRGBString(r, g, b, opacity * opacityMultiplier);
    const strokeWidth = sectorLineWidth;
    const strokeStyle = sectorLineStroke;
    return { strokeWidth, strokeStyle, fillColor, ...node };
  });
}

/** @internal */
export function makeOutsideLinksViewModel(
  outsideFillNodes: ShapeTreeNode[],
  rowSets: RowSet[],
  linkLabelRadiusPadding: Distance,
): OutsideLinksViewModel[] {
  return outsideFillNodes
    .map<OutsideLinksViewModel>((node, i: number) => {
      const rowSet = rowSets[i];
      if (!rowSet.rows.reduce((p, row) => p + row.rowWords.length, 0)) return { points: [] };
      const radius = ringSectorOuterRadius(node);
      const midAngle = trueBearingToStandardPositionAngle(meanAngle(node.x0, node.x1));
      const cos = Math.cos(midAngle);
      const sin = Math.sin(midAngle);
      const x0 = cos * radius;
      const y0 = sin * radius;
      const x = cos * (radius + linkLabelRadiusPadding);
      const y = sin * (radius + linkLabelRadiusPadding);
      return {
        points: [
          [x0, y0],
          [x, y],
        ],
      };
    })
    .filter(({ points }: OutsideLinksViewModel) => points.length > 1);
}

/** @internal */
export interface RectangleConstruction {
  x0: Pixels;
  x1: Pixels;
  y0: Pixels;
  y1: Pixels;
}

function rectangleConstruction(treeHeight: number, topGroove: number) {
  return function(node: ShapeTreeNode): RectangleConstruction {
    return node.depth < treeHeight
      ? {
          x0: node.x0,
          y0: node.y0px,
          x1: node.x1,
          y1: node.y0px + getTopPadding(topGroove, node.y1px - node.y0px),
        }
      : {
          x0: node.x0,
          y0: node.y0px,
          x1: node.x1,
          y1: node.y1px,
        };
  };
}

/** @internal */
export function shapeViewModel(
  textMeasure: TextMeasure,
  config: Config,
  layers: Layer[],
  rawTextGetter: RawTextGetter,
  specifiedValueFormatter: ValueFormatter,
  specifiedPercentFormatter: ValueFormatter,
  valueGetter: ValueGetterFunction,
  tree: HierarchyOfArrays,
  topGroove: Pixels,
  containerBackgroundColor?: Color,
): ShapeViewModel {
  const {
    width,
    height,
    margin,
    emptySizeRatio,
    outerSizeRatio,
    fillOutside,
    linkLabel,
    clockwiseSectors,
    specialFirstInnermostSector,
    minFontSize,
    partitionLayout,
    sectorLineWidth,
  } = config;
  const innerWidth = width * (1 - Math.min(1, margin.left + margin.right));
  const innerHeight = height * (1 - Math.min(1, margin.top + margin.bottom));

  const diskCenter = {
    x: width * margin.left + innerWidth / 2,
    y: height * margin.top + innerHeight / 2,
  };

  // don't render anything if the total, the width or height is not positive
  if (!(width > 0) || !(height > 0) || tree.length === 0) {
    return nullShapeViewModel(config, diskCenter);
  }

  const totalValue = tree.reduce((p: number, n: ArrayEntry): number => p + mapEntryValue(n), 0);

  const sunburstValueToAreaScale = TAU / totalValue;
  const sunburstAreaAccessor = (e: ArrayEntry) => sunburstValueToAreaScale * mapEntryValue(e);
  const treemapLayout = partitionLayout === PartitionLayout.treemap;
  const treemapInnerArea = treemapLayout ? width * height : 1; // assuming 1 x 1 unit square
  const treemapValueToAreaScale = treemapInnerArea / totalValue;
  const treemapAreaAccessor = (e: ArrayEntry) => treemapValueToAreaScale * mapEntryValue(e);

  const rawChildNodes: Array<Part> = treemapLayout
    ? treemap(tree, treemapAreaAccessor, topGrooveAccessor(topGroove), grooveAccessor, {
        x0: -width / 2,
        y0: -height / 2,
        width,
        height,
      })
    : sunburst(tree, sunburstAreaAccessor, { x0: 0, y0: -1 }, clockwiseSectors, specialFirstInnermostSector);

  const shownChildNodes = rawChildNodes.filter((n: Part) => {
    const layerIndex = entryValue(n.node).depth - 1;
    const layer = layers[layerIndex];
    return !layer || !layer.showAccessor || layer.showAccessor(entryKey(n.node));
  });

  // use the smaller of the two sizes, as a circle fits into a square
  const circleMaximumSize = Math.min(innerWidth, innerHeight);
  const outerRadius: Radius = Math.min(outerSizeRatio * circleMaximumSize, circleMaximumSize - sectorLineWidth) / 2;
  const innerRadius: Radius = outerRadius - (1 - emptySizeRatio) * outerRadius;
  const treeHeight = shownChildNodes.reduce((p: number, n: Part) => Math.max(p, entryValue(n.node).depth), 0); // 1: pie, 2: two-ring donut etc.
  const ringThickness = (outerRadius - innerRadius) / treeHeight;
  const partToShapeFn = partToShapeTreeNode(treemapLayout, innerRadius, ringThickness);
  const quadViewModel = makeQuadViewModel(
    shownChildNodes.slice(1).map(partToShapeFn),
    layers,
    config.sectorLineWidth,
    config.sectorLineStroke,
  );

  // fill text
  const roomCondition = (n: ShapeTreeNode) => {
    const diff = n.x1 - n.x0;
    return treemapLayout
      ? n.x1 - n.x0 > minFontSize && n.y1px - n.y0px > minFontSize
      : (diff < 0 ? TAU + diff : diff) * ringSectorMiddleRadius(n) > Math.max(minFontSize, linkLabel.maximumSection);
  };

  const nodesWithRoom = quadViewModel.filter(roomCondition);
  const outsideFillNodes = fillOutside && !treemapLayout ? nodesWithRoom : [];

  const textFillOrigins = nodesWithRoom.map(treemapLayout ? rectangleFillOrigins : sectorFillOrigins(fillOutside));

  const valueFormatter = valueGetter === percentValueGetter ? specifiedPercentFormatter : specifiedValueFormatter;

  const getRowSets = treemapLayout
    ? fillTextLayout(
        rectangleConstruction(treeHeight, topGroove),
        getRectangleRowGeometry,
        () => 0,
        containerBackgroundColor,
      )
    : fillTextLayout(
        ringSectorConstruction(config, innerRadius, ringThickness),
        getSectorRowGeometry,
        inSectorRotation(config.horizontalTextEnforcer, config.horizontalTextAngleThreshold),
        containerBackgroundColor,
      );

  const rowSets: RowSet[] = getRowSets(
    textMeasure,
    rawTextGetter,
    valueGetter,
    valueFormatter,
    nodesWithRoom,
    config,
    layers,
    textFillOrigins,
    treemapLayout,
    !treemapLayout,
  );

  // whiskers (ie. just lines, no text) for fill text outside the outer radius
  const outsideLinksViewModel = makeOutsideLinksViewModel(outsideFillNodes, rowSets, linkLabel.radiusPadding);

  // linked text
  const currentY = [-height, -height, -height, -height];

  const nodesWithoutRoom =
    fillOutside || treemapLayout
      ? [] // outsideFillNodes and linkLabels are in inherent conflict due to very likely overlaps
      : quadViewModel.filter((n: ShapeTreeNode) => {
          const id = nodeId(n);
          const foundInFillText = rowSets.find((r: RowSet) => r.id === id);
          // successful text render if found, and has some row(s)
          return !(foundInFillText && foundInFillText.rows.length !== 0);
        });
  const maxLinkedLabelTextLength = config.linkLabel.maxTextLength;
  const linkLabelViewModels = linkTextLayout(
    width,
    height,
    textMeasure,
    config,
    nodesWithoutRoom,
    currentY,
    outerRadius,
    rawTextGetter,
    valueGetter,
    valueFormatter,
    maxLinkedLabelTextLength,
    diskCenter,
    containerBackgroundColor,
  );

  const pickQuads: PickFunction = (x, y) =>
    quadViewModel.filter(
      treemapLayout
        ? ({ x0, y0, x1, y1 }) => x0 <= x && x <= x1 && y0 <= y && y <= y1
        : ({ x0, y0px, x1, y1px }) => {
            const angleX = (Math.atan2(y, x) + TAU / 4 + TAU) % TAU;
            const yPx = Math.sqrt(x * x + y * y);
            return x0 <= angleX && angleX <= x1 && y0px <= yPx && yPx <= y1px;
          },
    );

  // combined viewModel
  return {
    config,
    diskCenter,
    quadViewModel,
    rowSets,
    linkLabelViewModels,
    outsideLinksViewModel,
    pickQuads,
    outerRadius,
  };
}

function partToShapeTreeNode(treemapLayout: boolean, innerRadius: Radius, ringThickness: number) {
  return ({ node, x0, x1, y0, y1 }: Part): ShapeTreeNode => ({
    dataName: entryKey(node),
    depth: depthAccessor(node),
    value: aggregateAccessor(node),
    parent: parentAccessor(node),
    sortIndex: sortIndexAccessor(node),
    path: pathAccessor(node),
    x0,
    x1,
    y0,
    y1,
    y0px: treemapLayout ? y0 : innerRadius + y0 * ringThickness,
    y1px: treemapLayout ? y1 : innerRadius + y1 * ringThickness,
    yMidPx: treemapLayout ? (y0 + y1) / 2 : innerRadius + ((y0 + y1) / 2) * ringThickness,
  });
}
