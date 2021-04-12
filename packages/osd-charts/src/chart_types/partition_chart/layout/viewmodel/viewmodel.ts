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

import { argsToRGBString, stringToRGB } from '../../../../common/color_library_wrappers';
import { TAU } from '../../../../common/constants';
import { fillTextColor } from '../../../../common/fill_text_color';
import {
  Distance,
  meanAngle,
  Pixels,
  PointTuple,
  Radius,
  trueBearingToStandardPositionAngle,
} from '../../../../common/geometry';
import { Part, TextMeasure } from '../../../../common/text_utils';
import { GroupByAccessor, SmallMultiplesStyle } from '../../../../specs';
import { StrokeStyle, ValueFormatter, Color, RecursivePartial } from '../../../../utils/common';
import { Layer } from '../../specs';
import { config as defaultConfig, MODEL_KEY, percentValueGetter } from '../config';
import { Config, FillLabelConfig, PartitionLayout } from '../types/config_types';
import {
  nullShapeViewModel,
  OutsideLinksViewModel,
  PartitionSmallMultiplesModel,
  PickFunction,
  QuadViewModel,
  RawTextGetter,
  RowSet,
  ShapeTreeNode,
  ShapeViewModel,
  ValueGetterFunction,
} from '../types/viewmodel_types';
import { ringSectorConstruction } from '../utils/circline_geometry';
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
import { sunburst } from '../utils/sunburst';
import { getTopPadding, LayerLayout, treemap } from '../utils/treemap';
import {
  fillTextLayout,
  getRectangleRowGeometry,
  getSectorRowGeometry,
  inSectorRotation,
  nodeId,
} from './fill_text_layout';
import { linkTextLayout } from './link_text_layout';

/** @internal */
export const isMosaic = (p: PartitionLayout | undefined) => p === PartitionLayout.mosaic;

/** @internal */
export const isTreemap = (p: PartitionLayout | undefined) => p === PartitionLayout.treemap;

/** @internal */
export const isSunburst = (p: PartitionLayout | undefined) => p === PartitionLayout.sunburst;

/** @internal */
export const isIcicle = (p: PartitionLayout | undefined) => p === PartitionLayout.icicle;

/** @internal */
export const isFlame = (p: PartitionLayout | undefined) => p === PartitionLayout.flame;

/** @internal */
export const isLinear = (p: PartitionLayout | undefined) => isFlame(p) || isIcicle(p);

/** @internal */
export const isSimpleLinear = (config: RecursivePartial<Config>, layers: Layer[]) =>
  isLinear(config.partitionLayout) && layers.every((l) => l.fillLabel?.clipText ?? config.fillLabel?.clipText);

function grooveAccessor(n: ArrayEntry) {
  return entryValue(n).depth > 1 ? 1 : [0, 2][entryValue(n).depth];
}

function topGrooveAccessor(topGroovePx: Pixels) {
  return (n: ArrayEntry) => (entryValue(n).depth > 0 ? topGroovePx : grooveAccessor(n));
}

function rectangleFillOrigins(n: ShapeTreeNode): PointTuple {
  return [(n.x0 + n.x1) / 2, (n.y0 + n.y1) / 2];
}

/**
 * @internal
 */
export const ringSectorInnerRadius = (n: ShapeTreeNode): Radius => n.y0px;

/**
 * @internal
 */
export const ringSectorOuterRadius = (n: ShapeTreeNode): Radius => n.y1px;

/**
 * @internal
 */
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

const minRectHeightForText: Pixels = 8;

/** @internal */
export function makeQuadViewModel(
  childNodes: ShapeTreeNode[],
  layers: Layer[],
  sectorLineWidth: Pixels,
  sectorLineStroke: StrokeStyle,
  smAccessorValue: ReturnType<GroupByAccessor>,
  index: number,
  innerIndex: number,
  fillLabel: FillLabelConfig,
  isSunburstLayout: boolean,
  containerBackgroundColor?: Color,
): Array<QuadViewModel> {
  return childNodes.map((node) => {
    const opacityMultiplier = 1; // could alter in the future, eg. in response to interactions
    const layer = layers[node.depth - 1];
    const fillColorSpec = layer && layer.shape && layer.shape.fillColor;
    const fill = fillColorSpec ?? 'rgba(128,0,0,0.5)';
    const shapeFillColor = typeof fill === 'function' ? fill(node, node.sortIndex, node[MODEL_KEY].children) : fill;
    const { r, g, b, opacity } = stringToRGB(shapeFillColor);
    const fillColor = argsToRGBString(r, g, b, opacity * opacityMultiplier);
    const strokeWidth = sectorLineWidth;
    const strokeStyle = sectorLineStroke;
    const textNegligible = node.y1px - node.y0px < minRectHeightForText;
    const { textColor, textInvertible, textContrast } = { ...fillLabel, ...layer.fillLabel };
    const color =
      !isSunburstLayout && textNegligible
        ? 'transparent'
        : fillTextColor(textColor, textInvertible, textContrast, fillColor, containerBackgroundColor);
    return { index, innerIndex, smAccessorValue, strokeWidth, strokeStyle, fillColor, textColor: color, ...node };
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

function rectangleConstruction(treeHeight: number, topGroove: number | null) {
  return function rectangleConstructionClosure(node: ShapeTreeNode): RectangleConstruction {
    return node.depth < treeHeight && topGroove !== null
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

const rawChildNodes = (
  partitionLayout: PartitionLayout,
  tree: HierarchyOfArrays,
  topGroove: number,
  width: number,
  height: number,
  clockwiseSectors: boolean,
  specialFirstInnermostSector: boolean,
  maxDepth: number,
): Array<Part> => {
  const totalValue = tree.reduce((p: number, n: ArrayEntry): number => p + mapEntryValue(n), 0);
  switch (partitionLayout) {
    case PartitionLayout.sunburst:
      const sunburstValueToAreaScale = TAU / totalValue;
      const sunburstAreaAccessor = (e: ArrayEntry) => sunburstValueToAreaScale * mapEntryValue(e);
      return sunburst(tree, sunburstAreaAccessor, { x0: 0, y0: -1 }, clockwiseSectors, specialFirstInnermostSector);

    case PartitionLayout.treemap:
    case PartitionLayout.mosaic:
      const treemapInnerArea = width * height; // assuming 1 x 1 unit square
      const treemapValueToAreaScale = treemapInnerArea / totalValue;
      const treemapAreaAccessor = (e: ArrayEntry) => treemapValueToAreaScale * mapEntryValue(e);
      return treemap(
        tree,
        treemapAreaAccessor,
        topGrooveAccessor(topGroove),
        grooveAccessor,
        {
          x0: 0,
          y0: 0,
          width,
          height,
        },
        isMosaic(partitionLayout) ? [LayerLayout.vertical, LayerLayout.horizontal] : [],
      );

    case PartitionLayout.icicle:
    case PartitionLayout.flame:
      const icicleLayout = isIcicle(partitionLayout);
      const icicleValueToAreaScale = width / totalValue;
      const icicleAreaAccessor = (e: ArrayEntry) => icicleValueToAreaScale * mapEntryValue(e);
      const icicleRowHeight = height / maxDepth;
      const result = sunburst(tree, icicleAreaAccessor, { x0: 0, y0: -icicleRowHeight }, true, false, icicleRowHeight);
      return icicleLayout
        ? result
        : result.map(({ y0, y1, ...rest }) => ({ y0: height - y1, y1: height - y0, ...rest }));

    default:
      // Let's ensure TS complains if we add a new PartitionLayout type in the future without creating a `case` for it
      // Hopefully, a future TS version will do away with the need for this boilerplate `default`. Now TS even needs a `default` even if all possible cases are covered.
      // Even in runtime it does something sensible (returns the empty set); explicit throwing is avoided as it can deopt the function
      return ((layout: never) => layout ?? [])(partitionLayout);
  }
};

/** @internal */
export type PanelPlacement = PartitionSmallMultiplesModel;

/**
 * Todo move it to config
 * @internal
 */
export const panelTitleFontSize = 16;

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
  containerBackgroundColor: Color,
  smallMultiplesStyle: SmallMultiplesStyle,
  panel: PanelPlacement,
): ShapeViewModel {
  const {
    width,
    height,
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

  const { marginLeftPx, marginTopPx, panelInnerWidth, panelInnerHeight } = panel;

  const treemapLayout = isTreemap(partitionLayout);
  const mosaicLayout = isMosaic(partitionLayout);
  const sunburstLayout = isSunburst(partitionLayout);
  const icicleLayout = isIcicle(partitionLayout);
  const flameLayout = isFlame(partitionLayout);
  const simpleLinear = isSimpleLinear(config, layers);

  const diskCenter = isSunburst(partitionLayout)
    ? {
        x: marginLeftPx + panelInnerWidth / 2,
        y: marginTopPx + panelInnerHeight / 2,
      }
    : {
        x: marginLeftPx,
        y: marginTopPx,
      };

  // don't render anything if the total, the width or height is not positive
  if (!(width > 0) || !(height > 0) || tree.length === 0) {
    return nullShapeViewModel(config, diskCenter);
  }

  const longestPath = ([, { children, path }]: ArrayEntry): number =>
    children.length > 0 ? children.reduce((p, n) => Math.max(p, longestPath(n)), 0) : path.length;
  const maxDepth = longestPath(tree[0]) - 2; // don't include the root node
  const childNodes = rawChildNodes(
    partitionLayout,
    tree,
    topGroove,
    panelInnerWidth,
    panelInnerHeight,
    clockwiseSectors,
    specialFirstInnermostSector,
    maxDepth,
  );

  const shownChildNodes = childNodes.filter((n: Part) => {
    const layerIndex = entryValue(n.node).depth - 1;
    const layer = layers[layerIndex];
    return !layer || !layer.showAccessor || layer.showAccessor(entryKey(n.node));
  });

  // use the smaller of the two sizes, as a circle fits into a square
  const circleMaximumSize = Math.min(
    panelInnerWidth,
    panelInnerHeight - (panel.panelTitle.length > 0 ? panelTitleFontSize * 2 : 0),
  );
  const outerRadius: Radius = Math.min(outerSizeRatio * circleMaximumSize, circleMaximumSize - sectorLineWidth) / 2;
  const innerRadius: Radius = outerRadius - (1 - emptySizeRatio) * outerRadius;
  const treeHeight = shownChildNodes.reduce((p: number, n: Part) => Math.max(p, entryValue(n.node).depth), 0); // 1: pie, 2: two-ring donut etc.
  const ringThickness = (outerRadius - innerRadius) / treeHeight;
  const partToShapeFn = partToShapeTreeNode(!sunburstLayout, innerRadius, ringThickness);
  const quadViewModel = makeQuadViewModel(
    shownChildNodes.slice(1).map(partToShapeFn),
    layers,
    config.sectorLineWidth,
    config.sectorLineStroke,
    panel.smAccessorValue,
    panel.index,
    panel.innerIndex,
    config.fillLabel,
    sunburstLayout,
    containerBackgroundColor,
  );

  // fill text
  const roomCondition = (n: ShapeTreeNode) => {
    const diff = n.x1 - n.x0;
    return sunburstLayout
      ? (diff < 0 ? TAU + diff : diff) * ringSectorMiddleRadius(n) > Math.max(minFontSize, linkLabel.maximumSection)
      : n.x1 - n.x0 > minFontSize && n.y1px - n.y0px > minFontSize;
  };

  const nodesWithRoom = quadViewModel.filter(roomCondition);
  const outsideFillNodes = fillOutside && sunburstLayout ? nodesWithRoom : [];

  const textFillOrigins = nodesWithRoom.map(sunburstLayout ? sectorFillOrigins(fillOutside) : rectangleFillOrigins);

  const valueFormatter = valueGetter === percentValueGetter ? specifiedPercentFormatter : specifiedValueFormatter;

  const getRowSets = sunburstLayout
    ? fillTextLayout(
        ringSectorConstruction(config, innerRadius, ringThickness),
        getSectorRowGeometry,
        inSectorRotation(config.horizontalTextEnforcer, config.horizontalTextAngleThreshold),
      )
    : simpleLinear
    ? () => [] // no multirow layout needed for simpleLinear partitions
    : fillTextLayout(
        rectangleConstruction(treeHeight, treemapLayout || mosaicLayout ? topGroove : null),
        getRectangleRowGeometry,
        () => 0,
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
    !sunburstLayout,
    !(treemapLayout || mosaicLayout),
  );

  // whiskers (ie. just lines, no text) for fill text outside the outer radius
  const outsideLinksViewModel = makeOutsideLinksViewModel(outsideFillNodes, rowSets, linkLabel.radiusPadding);

  // linked text
  const currentY = [-height, -height, -height, -height];

  const nodesWithoutRoom =
    fillOutside || treemapLayout || mosaicLayout || icicleLayout || flameLayout
      ? [] // outsideFillNodes and linkLabels are in inherent conflict due to very likely overlaps
      : quadViewModel.filter((n: ShapeTreeNode) => {
          const id = nodeId(n);
          const foundInFillText = rowSets.find((r: RowSet) => r.id === id);
          // successful text render if found, and has some row(s)
          return !(foundInFillText && foundInFillText.rows.length > 0);
        });
  const maxLinkedLabelTextLength = config.linkLabel.maxTextLength;
  const linkLabelViewModels = linkTextLayout(
    panelInnerWidth,
    panelInnerHeight,
    textMeasure,
    config,
    nodesWithoutRoom,
    currentY,
    outerRadius,
    rawTextGetter,
    valueGetter,
    valueFormatter,
    maxLinkedLabelTextLength,
    {
      x: width * panel.left + panelInnerWidth / 2,
      y: height * panel.top + panelInnerHeight / 2,
    },
    containerBackgroundColor,
  );

  const pickQuads: PickFunction = sunburstLayout
    ? (x, y) => {
        return quadViewModel.filter(({ x0, y0px, x1, y1px }) => {
          const angleX = (Math.atan2(y, x) + TAU / 4 + TAU) % TAU;
          const yPx = Math.sqrt(x * x + y * y);
          return x0 <= angleX && angleX <= x1 && y0px <= yPx && yPx <= y1px;
        });
      }
    : (x, y, { currentFocusX0, currentFocusX1 }) => {
        return quadViewModel.filter(({ x0, y0px, x1, y1px }) => {
          const scale = width / (currentFocusX1 - currentFocusX0);
          const fx0 = Math.max((x0 - currentFocusX0) * scale, 0);
          const fx1 = Math.min((x1 - currentFocusX0) * scale, width);
          return fx0 <= x && x < fx1 && y0px < y && y <= y1px;
        });
      };

  // combined viewModel
  return {
    partitionLayout: config?.partitionLayout ?? defaultConfig.partitionLayout,
    smAccessorValue: panel.smAccessorValue,
    panelTitle: panel.panelTitle,
    index: panel.index,
    innerIndex: panel.innerIndex,
    width: panel.width,
    height: panel.height,
    top: panel.top,
    left: panel.left,
    innerRowCount: panel.innerRowCount,
    innerColumnCount: panel.innerColumnCount,
    innerRowIndex: panel.innerRowIndex,
    innerColumnIndex: panel.innerColumnIndex,
    marginLeftPx: panel.marginLeftPx,
    marginTopPx: panel.marginTopPx,
    panelInnerWidth: panel.panelInnerWidth,
    panelInnerHeight: panel.panelInnerHeight,

    config,
    layers,
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
    [MODEL_KEY]: parentAccessor(node),
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
