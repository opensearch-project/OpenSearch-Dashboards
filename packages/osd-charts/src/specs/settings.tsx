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

import { ComponentType } from 'react';
import { $Values } from 'utility-types';

import { DomainRange } from '../chart_types/xy_chart/utils/specs';
import { PartialTheme, Theme } from '../utils/themes/theme';
import { Domain } from '../utils/domain';
import { getConnect, specComponentFactory } from '../state/spec_factory';
import { Spec } from '.';
import { LIGHT_THEME } from '../utils/themes/light_theme';
import { ChartTypes } from '../chart_types';
import { GeometryValue } from '../utils/geometry';
import { XYChartSeriesIdentifier } from '../chart_types/xy_chart/utils/series';
import { SeriesIdentifier } from '../commons/series_id';
import { Accessor } from '../utils/accessor';
import { Position, Rendering, Rotation, Color } from '../utils/commons';
import { ScaleContinuousType, ScaleOrdinalType } from '../scales';
import { PrimitiveValue } from '../chart_types/partition_chart/layout/utils/group_by_rollup';

export interface LayerValue {
  groupByRollup: PrimitiveValue;
  value: number;
}

export type XYChartElementEvent = [GeometryValue, XYChartSeriesIdentifier];
export type PartitionElementEvent = [Array<LayerValue>, SeriesIdentifier];

export type ElementClickListener = (elements: Array<XYChartElementEvent | PartitionElementEvent>) => void;
export type ElementOverListener = (elements: Array<XYChartElementEvent | PartitionElementEvent>) => void;
export type BrushEndListener = (min: number, max: number) => void;
export type LegendItemListener = (series: SeriesIdentifier | null) => void;
export type PointerUpdateListener = (event: PointerEvent) => void;
/**
 * Listener to be called when chart render state changes
 *
 * `isRendered` value is `true` when rendering is complete and `false` otherwise
 */
export type RenderChangeListener = (isRendered: boolean) => void;
export type BasicListener = () => undefined | void;

export const PointerEventType = Object.freeze({
  Over: 'Over' as 'Over',
  Out: 'Out' as 'Out',
});

export type PointerEventType = $Values<typeof PointerEventType>;

export interface BasePointerEvent {
  chartId: string;
  type: PointerEventType;
}
/**
 * Event used to syncronize pointers/mouse positions between Charts.
 *
 * fired as callback argument for `PointerUpdateListener`
 */
export interface PointerOverEvent extends BasePointerEvent {
  type: typeof PointerEventType.Over;
  scale: ScaleContinuousType | ScaleOrdinalType;
  /**
   * @todo
   * unit for event (i.e. `time`, `feet`, `count`, etc.)
   */
  unit?: string;
  value: number | string | null;
}
export interface PointerOutEvent extends BasePointerEvent {
  type: typeof PointerEventType.Out;
}

export type PointerEvent = PointerOverEvent | PointerOutEvent;

/** The type of tooltip to use */
export const TooltipType = Object.freeze({
  /** Vertical cursor parallel to x axis */
  VerticalCursor: 'vertical' as 'vertical',
  /** Vertical and horizontal cursors */
  Crosshairs: 'cross' as 'cross',
  /** Follor the mouse coordinates */
  Follow: 'follow' as 'follow',
  /** Hide every tooltip */
  None: 'none' as 'none',
});

export type TooltipType = $Values<typeof TooltipType>;

export interface TooltipValue {
  /**
   * The label of the tooltip value
   */
  label: string;
  /**
   * The value to display
   */
  value: any;
  /**
   * The mark value to display
   */
  markValue?: any;
  /**
   * The color of the graphic mark (by default the color of the series)
   */
  color: Color;
  /**
   * True if the mouse is over the graphic mark connected to the tooltip
   */
  isHighlighted: boolean;
  /**
   * True if the tooltip is visible, false otherwise
   */
  isVisible: boolean;
  /**
   * The idenfitier of the related series
   */
  seriesIdentifier: SeriesIdentifier;
  /**
   * The accessor linked to the current tooltip value
   */
  valueAccessor?: Accessor;
}

export type TooltipValueFormatter = (data: TooltipValue) => JSX.Element | string;

export interface TooltipProps {
  type?: TooltipType;
  snap?: boolean;
  headerFormatter?: TooltipValueFormatter;
  unit?: string;
}

export interface LegendColorPickerProps {
  /**
   * Anchor used to position picker
   */
  anchor: HTMLElement;
  /**
   * Current color of the given series
   */
  color: Color;
  /**
   * Callback to close color picker and set persistent color
   */
  onClose: () => void;
  /**
   * Callback to update temporary color state
   */
  onChange: (color: Color) => void;
  /**
   * Series id for the active series
   */
  seriesIdentifier: SeriesIdentifier;
}
export type LegendColorPicker = ComponentType<LegendColorPickerProps>;

/**
 * Buffer between cursor and point to trigger interaction
 */
export type MarkBuffer = number | ((radius: number) => number);

export interface SettingsSpec extends Spec {
  /**
   * Partial theme to be merged with base
   *
   * or
   *
   * Array of partial themes to be merged with base
   * index `0` being the hightest priority
   *
   * i.e. `[primary, secondary, tertiary]`
   */
  theme?: PartialTheme | PartialTheme[];
  /**
   * Full default theme to use as base
   *
   * @default `LIGHT_THEME`
   */
  baseTheme?: Theme;
  rendering: Rendering;
  rotation: Rotation;
  animateData: boolean;
  showLegend: boolean;
  /** Either a TooltipType or an object with configuration of type, snap, and/or headerFormatter */
  tooltip: TooltipType | TooltipProps;
  debug: boolean;
  legendPosition: Position;
  /**
   * Show an extra parameter on each legend item defined by the chart type
   * @default false
   */
  showLegendExtra: boolean;
  /**
   * Limit the legend to a max depth when showing a hierarchical legend
   */
  legendMaxDepth?: number;
  /**
   * Display the legend as a flat hierarchy
   */
  flatLegend?: boolean;
  /**
   * Removes duplicate axes
   *
   * Compares title, position and first & last tick labels
   */
  hideDuplicateAxes: boolean;
  onElementClick?: ElementClickListener;
  onElementOver?: ElementOverListener;
  onElementOut?: BasicListener;
  pointBuffer?: MarkBuffer;
  onBrushEnd?: BrushEndListener;
  onLegendItemOver?: LegendItemListener;
  onLegendItemOut?: BasicListener;
  onLegendItemClick?: LegendItemListener;
  onLegendItemPlusClick?: LegendItemListener;
  onLegendItemMinusClick?: LegendItemListener;
  onPointerUpdate?: PointerUpdateListener;
  onRenderChange?: RenderChangeListener;
  xDomain?: Domain | DomainRange;
  resizeDebounce?: number;
  legendColorPicker?: LegendColorPicker;
}

export type DefaultSettingsProps =
  | 'id'
  | 'chartType'
  | 'specType'
  | 'rendering'
  | 'rotation'
  | 'resizeDebounce'
  | 'animateData'
  | 'showLegend'
  | 'debug'
  | 'tooltip'
  | 'showLegendExtra'
  | 'theme'
  | 'legendPosition'
  | 'hideDuplicateAxes';

export const DEFAULT_TOOLTIP_TYPE = TooltipType.VerticalCursor;
export const DEFAULT_TOOLTIP_SNAP = true;

export const SpecTypes = Object.freeze({
  Series: 'series' as 'series',
  Axis: 'axis' as 'axis',
  Annotation: 'annotation' as 'annotation',
  Settings: 'settings' as 'settings',
});

export type SpecTypes = $Values<typeof SpecTypes>;

export const DEFAULT_SETTINGS_SPEC: SettingsSpec = {
  id: '__global__settings___',
  chartType: ChartTypes.Global,
  specType: SpecTypes.Settings,
  rendering: 'canvas' as 'canvas',
  rotation: 0 as 0,
  animateData: true,
  showLegend: false,
  resizeDebounce: 10,
  debug: false,
  tooltip: {
    type: DEFAULT_TOOLTIP_TYPE,
    snap: DEFAULT_TOOLTIP_SNAP,
  },
  legendPosition: Position.Right,
  showLegendExtra: false,
  hideDuplicateAxes: false,
  theme: LIGHT_THEME,
};

export type SettingsSpecProps = Partial<Omit<SettingsSpec, 'chartType' | 'specType' | 'id'>>;

export const Settings: React.FunctionComponent<SettingsSpecProps> = getConnect()(
  specComponentFactory<SettingsSpec, DefaultSettingsProps>(DEFAULT_SETTINGS_SPEC),
);

/** @internal */
export function isPointerOutEvent(event: PointerEvent | null | undefined): event is PointerOutEvent {
  return event !== null && event !== undefined && event.type === PointerEventType.Out;
}

/** @internal */
export function isPointerOverEvent(event: PointerEvent | null | undefined): event is PointerOverEvent {
  return event !== null && event !== undefined && event.type === PointerEventType.Over;
}

/** @internal */
export function isTooltipProps(config: TooltipType | TooltipProps): config is TooltipProps {
  return typeof config === 'object';
}

/** @internal */
export function isTooltipType(config: TooltipType | TooltipProps): config is TooltipType {
  return typeof config === 'string';
}

/** @internal */
export function isCrosshairTooltipType(type: TooltipType) {
  return type === TooltipType.VerticalCursor || type === TooltipType.Crosshairs;
}

/** @internal */
export function isFollowTooltipType(type: TooltipType) {
  return type === TooltipType.Follow;
}

/** @internal */
export function getTooltipType(settings: SettingsSpec): TooltipType | undefined {
  const { tooltip } = settings;
  if (tooltip === undefined || tooltip === null) {
    return undefined;
  }
  if (isTooltipType(tooltip)) {
    return tooltip;
  }
  if (isTooltipProps(tooltip)) {
    return tooltip.type || undefined;
  }
  return undefined;
}
