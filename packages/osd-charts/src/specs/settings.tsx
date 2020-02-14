import { $Values } from 'utility-types';
import { DomainRange } from '../chart_types/xy_chart/utils/specs';
import { PartialTheme, Theme } from '../utils/themes/theme';
import { Domain } from '../utils/domain';
import { TooltipType, TooltipValueFormatter } from '../chart_types/xy_chart/utils/interactions';
import { getConnect, specComponentFactory } from '../state/spec_factory';
import { Spec } from '.';
import { LIGHT_THEME } from '../utils/themes/light_theme';
import { ChartTypes } from '../chart_types';
import { GeometryValue } from '../utils/geometry';
import { SeriesIdentifier } from '../chart_types/xy_chart/utils/series';
import { Position, Rendering, Rotation } from '../utils/commons';
import { ScaleContinuousType, ScaleOrdinalType } from '../scales';

export type ElementClickListener = (elements: Array<[GeometryValue, SeriesIdentifier]>) => void;
export type ElementOverListener = (elements: Array<[GeometryValue, SeriesIdentifier]>) => void;
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

interface TooltipProps {
  type?: TooltipType;
  snap?: boolean;
  headerFormatter?: TooltipValueFormatter;
  unit?: string;
}

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
  showLegendDisplayValue: boolean;
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
  | 'showLegendDisplayValue'
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
  showLegendDisplayValue: true,
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
