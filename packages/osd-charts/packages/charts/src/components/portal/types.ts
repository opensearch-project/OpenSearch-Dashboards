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

import { $Values } from 'utility-types';

import { Padding } from '../../utils/dimensions';

/**
 * Placement used in positioning tooltip
 * @public
 */
export const Placement = Object.freeze({
  Top: 'top' as const,
  Bottom: 'bottom' as const,
  Left: 'left' as const,
  Right: 'right' as const,
  TopStart: 'top-start' as const,
  TopEnd: 'top-end' as const,
  BottomStart: 'bottom-start' as const,
  BottomEnd: 'bottom-end' as const,
  RightStart: 'right-start' as const,
  RightEnd: 'right-end' as const,
  LeftStart: 'left-start' as const,
  LeftEnd: 'left-end' as const,
  Auto: 'auto' as const,
  AutoStart: 'auto-start' as const,
  AutoEnd: 'auto-end' as const,
});

/**
 * {@inheritDoc (Placement:variable)}
 * @public
 */
export type Placement = $Values<typeof Placement>;

/** @internal */
export type AnchorPosition = {
  /**
   * the right position of anchor
   */
  x: number;
  /**
   * the top position of the anchor
   */
  y: number;
  /**
   * the width of the anchor
   */
  width: number;
  /**
   * the height of the anchor
   */
  height: number;
};

/**
 * Used to position tooltip relative to invisible anchor via ref element
 *
 * @internal
 */
export interface PortalAnchorRef {
  /**
   * Positioning values relative to `anchorRef`. Return `null` if tooltip is not visible.
   */
  position: AnchorPosition | null;
  /**
   * Anchor ref element to use as position reference
   *
   * @defaultValue document.body
   */
  ref: HTMLElement | null;
}

/**
 * Tooltip portal settings
 *
 * @public
 */
export interface TooltipPortalSettings<B = never> {
  /**
   * Preferred placement of tooltip relative to anchor.
   *
   * This may not be the final placement given the positioning fallbacks.
   *
   * @defaultValue `right` {@link (Placement:type) | Placement.Right}
   */
  placement?: Placement;
  /**
   * If given tooltip placement is not suitable, these `Placement`s will
   * be used as fallback placements.
   */
  fallbackPlacements?: Placement[];
  /**
   * Boundary element to contain tooltip within
   *
   * `'chart'` will use the chart container as the boundary
   *
   * @defaultValue parent scroll container
   */
  boundary?: HTMLElement | B;
  /**
   * Boundary element padding.
   * Used to reduce extents of boundary placement when margins or paddings are used on boundary
   *
   * @defaultValue 0
   */
  boundaryPadding?: Partial<Padding> | number;
  /**
   * Custom tooltip offset
   * @defaultValue 10
   */
  offset?: number;
}
