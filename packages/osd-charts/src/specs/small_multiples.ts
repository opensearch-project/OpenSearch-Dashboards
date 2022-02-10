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

import React from 'react';

import { Spec } from '.';
import { ChartType } from '../chart_types';
import { Ratio } from '../common/geometry';
import { getConnect, specComponentFactory } from '../state/spec_factory';
import { SpecType } from './constants';

/**
 * Can be used for margin or padding start/end (eg. left/right or top/bottom)
 * Todo: this will soon change to `{outer, inner}` for explicit specification
 * @alpha
 */
export type RelativeBandsPadding = {
  /**
   * Outer padding specifies the padding size *next to* a small multiples panel that's on the edge of the small
   * multiples grid, expressed as a proportion (ratio) of the panel size
   */
  outer: Ratio;
  /**
   * Inner padding specifies the padding size *between* small multiples panels in the small multiples grid,
   * expressed as a proportion (ratio) of the panel size
   */
  inner: Ratio;
};

/** @internal */
export const DEFAULT_SM_PANEL_PADDING: RelativeBandsPadding = { outer: 0, inner: 0.1 };

/**
 * Specifies styling and stylistic layout attributes relating to small multiples
 * @alpha
 */
export interface SmallMultiplesStyle {
  /**
   * Horizontal padding for each panel, expressed as [leftMarginRatio, rightMarginRatio], relative to the gross panel width
   */
  horizontalPanelPadding: RelativeBandsPadding;
  /**
   * Vertical padding for each panel, expressed as [topMarginRatio, bottomMarginRatio], relative to the gross panel height
   */
  verticalPanelPadding: RelativeBandsPadding;
}

/** @alpha */
export interface SmallMultiplesSpec extends Spec {
  /**
   * Identifies the `<GroupBy id="foo">` referenced by `splitHorizontally="foo"`, specifying horizontal tiling
   */
  splitHorizontally?: string;
  /**
   * Identifies the `<GroupBy id="bar">` referenced by `splitVertically="bar"`, specifying vertical tiling
   */
  splitVertically?: string;
  /**
   * Identifies the `<GroupBy id="baz">` referenced by `splitVertically="baz"`, specifying space-filling tiling in a Z pattern
   */
  splitZigzag?: string;
  /**
   * Specifies styling and layout properties of the tiling, such as paddings between and outside panels
   */
  style?: Partial<SmallMultiplesStyle>;
}

const DEFAULT_SMALL_MULTIPLES_PROPS = {
  id: '__global__small_multiples___',
  chartType: ChartType.Global,
  specType: SpecType.SmallMultiples,
};

/** @alpha */
export type SmallMultiplesProps = Partial<Omit<SmallMultiplesSpec, 'chatType' | 'specType'>>;

/** @alpha */
export const SmallMultiples: React.FunctionComponent<SmallMultiplesProps> = getConnect()(
  specComponentFactory<SmallMultiplesSpec, 'id'>(DEFAULT_SMALL_MULTIPLES_PROPS),
);
