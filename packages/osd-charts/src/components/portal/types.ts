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

import { $Values } from 'utility-types';

/**
 * Placement used in positioning tooltip
 * @public
 */
export const Placement = Object.freeze({
  Top: 'top' as 'top',
  Bottom: 'bottom' as 'bottom',
  Left: 'left' as 'left',
  Right: 'right' as 'right',
  TopStart: 'top-start' as 'top-start',
  TopEnd: 'top-end' as 'top-end',
  BottomStart: 'bottom-start' as 'bottom-start',
  BottomEnd: 'bottom-end' as 'bottom-end',
  RightStart: 'right-start' as 'right-start',
  RightEnd: 'right-end' as 'right-end',
  LeftStart: 'left-start' as 'left-start',
  LeftEnd: 'left-end' as 'left-end',
  Auto: 'auto' as 'auto',
  AutoStart: 'auto-start' as 'auto-start',
  AutoEnd: 'auto-end' as 'auto-end',
});

/**
 * {@inheritDoc (Placement:variable)}
 * @public
 */
export type Placement = $Values<typeof Placement>;

/** @internal */
export interface PopperSettings {
  fallbackPlacements: Placement[];
  placement: Placement;
  boundary?: HTMLElement;
  offset?: number;
}

/** @internal */
export interface AnchorPosition {
  left: number;
  top: number;
  width?: number;
  height?: number;
}

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
   * @default document.body
   */
  ref: HTMLElement | null;
}
