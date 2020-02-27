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
import { XYChartSeriesIdentifier, SeriesIdentifier } from '../chart_types/xy_chart/utils/series';
import { Accessor } from '../utils/accessor';
import { Position, Rendering, Rotation, Color } from '../utils/commons';
import { ScaleContinuousType, ScaleOrdinalType } from '../scales';

export type ElementClickListener = (elements: Array<[GeometryValue, XYChartSeriesIdentifier]>) => void;
export type ElementOverListener = (elements: Array<[GeometryValue, XYChartSeriesIdentifier]>) => void;
export type BrushEndListener = (min: number, max: number) => void;
export type LegendItemListener = (series: XYChartSeriesIdentifier | null) => void;
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
  valueAccessor: Accessor;
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
  anchor: HTMLDivElement;
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
  seriesIdentifier: XYChartSeriesIdentifier;
}
export type LegendColorPicker = ComponentType<LegendColorPickerProps>;

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
   * Removes duplicate axes
   *
   * Compares title, position and first & last tick labels
   */
  hideDuplicateAxes: boolean;
  onElementClick?: ElementClickListener;
  onElementOver?: ElementOverListener;
  onElementOut?: BasicListener;
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

export function isPointerOutEvent(event: PointerEvent | null | undefined): event is PointerOutEvent {
  return event !== null && event !== undefined && event.type === PointerEventType.Out;
}

export function isPointerOverEvent(event: PointerEvent | null | undefined): event is PointerOverEvent {
  return event !== null && event !== undefined && event.type === PointerEventType.Over;
}

export function isTooltipProps(config: TooltipType | TooltipProps): config is TooltipProps {
  return typeof config === 'object';
}

export function isTooltipType(config: TooltipType | TooltipProps): config is TooltipType {
  return typeof config === 'string';
}

export function isCrosshairTooltipType(type: TooltipType) {
  return type === TooltipType.VerticalCursor || type === TooltipType.Crosshairs;
}

export function isFollowTooltipType(type: TooltipType) {
  return type === TooltipType.Follow;
}
