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

import { Dimensions } from '../../utils/dimensions';

export interface TooltipAnchorPosition {
  /**
   * true if the x axis is vertical
   */
  isRotated?: boolean;
  /**
   * the top position of the anchor
   */
  y0?: number;
  /**
   * the bottom position of the anchor
   */
  y1: number;
  /**
   * the right position of anchor
   */
  x0?: number;
  /**
   * the left position of the anchor
   */
  x1: number;
  /**
   * the padding to add between the tooltip position and the final position
   */
  padding?: number;
}

export function getFinalTooltipPosition(
  /** the dimensions of the chart parent container */
  container: Dimensions,
  /** the dimensions of the tooltip container */
  tooltip: Dimensions,
  /** the tooltip anchor computed position not adjusted within chart bounds */
  anchorPosition: TooltipAnchorPosition,
): {
  left: string | null;
  top: string | null;
} {
  const { x1, y1, isRotated, padding = 10 } = anchorPosition;
  let left = 0;
  let top = 0;

  const x0 = anchorPosition.x0 || anchorPosition.x1;
  const y0 = anchorPosition.y0 || anchorPosition.y1;

  if (!isRotated) {
    const leftOfBand = window.pageXOffset + container.left + x0;
    if (x1 + tooltip.width + padding > container.width) {
      left = leftOfBand - tooltip.width - padding;
    } else {
      left = leftOfBand + (x1 - x0) + padding;
    }
    const topOfBand = window.pageYOffset + container.top;
    if (y0 + tooltip.height > container.height) {
      top = topOfBand + container.height - tooltip.height;
    } else {
      top = topOfBand + y0;
    }
  } else {
    const leftOfBand = window.pageXOffset + container.left;
    if (x1 + tooltip.width > container.width) {
      left = leftOfBand + container.width - tooltip.width;
    } else {
      left = leftOfBand + x1;
    }
    const topOfBand = window.pageYOffset + container.top + y0;
    if (y1 + tooltip.height + padding > container.height) {
      top = topOfBand - tooltip.height - padding;
    } else {
      top = topOfBand + (y1 - y0) + padding;
    }
  }

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
}
