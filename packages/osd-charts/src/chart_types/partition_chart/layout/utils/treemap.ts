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

import { $Values as Values } from 'utility-types';

import { GOLDEN_RATIO } from '../../../../common/constants';
import { Pixels } from '../../../../common/geometry';
import { Part } from '../../../../common/text_utils';
import { ArrayEntry, CHILDREN_KEY, DEPTH_KEY, entryValue, HierarchyOfArrays } from './group_by_rollup';

const MAX_U_PADDING_RATIO = 0.0256197; // this limits area distortion to <10% (which occurs due to pixel padding) with very small rectangles
const MAX_TOP_PADDING_RATIO = 0.33; // this limits further area distortion to ~33%

interface LayoutElement {
  nodes: HierarchyOfArrays;
  dependentSize: number;
  sectionSizes: number[];
  sectionOffsets: number[];
}

function layVector(
  nodes: HierarchyOfArrays,
  independentSize: number,
  areaAccessor: (e: ArrayEntry) => number,
): LayoutElement {
  const area = nodes.reduce((p, n) => p + areaAccessor(n), 0);
  const dependentSize = area / independentSize; // here we lose a bit of accuracy
  let currentOffset = 0;
  const sectionOffsets = [currentOffset];
  const sectionSizes = nodes.map((e, i) => {
    const sectionSize = areaAccessor(e) / dependentSize; // here we gain back a bit of accuracy
    if (i < nodes.length - 1) sectionOffsets.push((currentOffset += sectionSize));
    return sectionSize;
  });

  return { nodes, dependentSize, sectionSizes, sectionOffsets }; // descriptor for a vector (column or row) of elements (nodes)
}

/** @internal */
export function leastSquarishAspectRatio({ sectionSizes, dependentSize }: LayoutElement) {
  return sectionSizes.reduce((p, n) => Math.min(p, n / dependentSize, dependentSize / n), 1);
}

const NullLayoutElement: LayoutElement = {
  nodes: [],
  dependentSize: NaN,
  sectionSizes: [],
  sectionOffsets: [],
};

/**
 * Specifies whether partitions are laid out horizontally, vertically or treemap-like tiling for preferably squarish aspect ratios
 * @public
 */
export const LayerLayout = Object.freeze({
  horizontal: 'horizontal' as const,
  vertical: 'vertical' as const,
  squarifying: 'squarifying' as const,
});

/**
 * Specifies whether partitions are laid out horizontally, vertically or treemap-like tiling for preferably squarish aspect ratios
 * @public
 */
export type LayerLayout = Values<typeof LayerLayout>; // could use ValuesType<typeof HierarchicalChartTypes>

function bestVector(
  nodes: HierarchyOfArrays,
  height: number,
  areaAccessor: (e: ArrayEntry) => number,
  layout: LayerLayout,
): LayoutElement {
  let previousWorstAspectRatio = -1;
  let currentWorstAspectRatio = 0;

  let previousVectorLayout: LayoutElement = NullLayoutElement;
  let currentVectorLayout: LayoutElement = NullLayoutElement;
  let currentCount = 1;

  do {
    previousVectorLayout = currentVectorLayout;
    previousWorstAspectRatio = currentWorstAspectRatio;
    currentVectorLayout = layVector(nodes.slice(0, currentCount), height, areaAccessor);
    currentWorstAspectRatio = leastSquarishAspectRatio(currentVectorLayout);
  } while (currentCount++ < nodes.length && (layout || currentWorstAspectRatio > previousWorstAspectRatio));

  return layout || currentWorstAspectRatio >= previousWorstAspectRatio ? currentVectorLayout : previousVectorLayout;
}

function vectorNodeCoordinates(vectorLayout: LayoutElement, x0Base: number, y0Base: number, vertical: boolean) {
  const { nodes, dependentSize, sectionSizes, sectionOffsets } = vectorLayout;
  return nodes.map((e: ArrayEntry, i: number) => {
    const x0 = vertical ? x0Base + sectionOffsets[i] : x0Base;
    const y0 = vertical ? y0Base : y0Base + sectionOffsets[i];
    const x1 = vertical ? x0 + sectionSizes[i] : x0 + dependentSize;
    const y1 = vertical ? y0 + dependentSize : y0 + sectionSizes[i];
    return { node: e, x0, y0, x1, y1 };
  });
}

/** @internal */
export const getTopPadding = (requestedTopPadding: number, fullHeight: Pixels) =>
  Math.min(requestedTopPadding, fullHeight * MAX_TOP_PADDING_RATIO);

/** @internal */
export function treemap(
  nodes: HierarchyOfArrays,
  areaAccessor: (e: ArrayEntry) => number,
  topPaddingAccessor: (e: ArrayEntry) => number,
  paddingAccessor: (e: ArrayEntry) => number,
  {
    x0: outerX0,
    y0: outerY0,
    width: outerWidth,
    height: outerHeight,
  }: { x0: number; y0: number; width: number; height: number },
  layouts: LayerLayout[],
): Array<Part> {
  if (nodes.length === 0) return [];
  // some bias toward horizontal rectangles with a golden ratio of width to height
  const depth = nodes[0][1][DEPTH_KEY] - 1;
  const layerLayout = layouts[depth] ?? null;
  const vertical = layerLayout === LayerLayout.vertical || (!layerLayout && outerWidth / GOLDEN_RATIO <= outerHeight);
  const independentSize = vertical ? outerWidth : outerHeight;
  const vectorElements = bestVector(nodes, independentSize, areaAccessor, layerLayout);
  const vector = vectorNodeCoordinates(vectorElements, outerX0, outerY0, vertical);
  const { dependentSize } = vectorElements;
  return vector
    .concat(
      ...vector.map(({ node, x0, y0, x1, y1 }) => {
        const childrenNodes = entryValue(node)[CHILDREN_KEY];
        if (childrenNodes.length === 0) {
          return [];
        }
        const fullWidth = x1 - x0;
        const fullHeight = y1 - y0;
        const uPadding = Math.min(
          paddingAccessor(node),
          fullWidth * MAX_U_PADDING_RATIO * 2,
          fullHeight * MAX_U_PADDING_RATIO * 2,
        );
        const topPadding = getTopPadding(topPaddingAccessor(node), fullHeight);
        const width = fullWidth - 2 * uPadding;
        const height = fullHeight - uPadding - topPadding;
        return treemap(
          childrenNodes,
          (d) => ((width * height) / (fullWidth * fullHeight)) * areaAccessor(d),
          topPaddingAccessor,
          paddingAccessor,
          {
            x0: x0 + uPadding,
            y0: y0 + topPadding,
            width,
            height,
          },
          layouts,
        );
      }),
    )
    .concat(
      treemap(
        nodes.slice(vector.length),
        areaAccessor,
        topPaddingAccessor,
        paddingAccessor,
        vertical
          ? { x0: outerX0, y0: outerY0 + dependentSize, width: outerWidth, height: outerHeight - dependentSize }
          : { x0: outerX0 + dependentSize, y0: outerY0, width: outerWidth - dependentSize, height: outerHeight },
        layouts,
      ),
    );
}
