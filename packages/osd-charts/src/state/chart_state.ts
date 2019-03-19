import { action, computed, IObservableValue, observable } from 'mobx';
import {
  AxisLinePosition,
  AxisTick,
  AxisTicksDimensions,
  computeAxisTicksDimensions,
  getAxisTicksPositions,
  mergeDomainsByGroupId,
} from '../lib/axes/axis_utils';
import { CanvasTextBBoxCalculator } from '../lib/axes/canvas_text_bbox_calculator';
import { XDomain } from '../lib/series/domains/x_domain';
import { YDomain } from '../lib/series/domains/y_domain';
import { computeLegend, LegendItem } from '../lib/series/legend';
import {
  AreaGeometry,
  BarGeometry,
  GeometryValue,
  LineGeometry,
  PointGeometry,
} from '../lib/series/rendering';
import { countClusteredSeries } from '../lib/series/scales';
import {
  DataSeriesColorsValues,
  FormattedDataSeries,
  getSeriesColorMap,
  RawDataSeries,
} from '../lib/series/series';
import {
  AreaSeriesSpec,
  AxisSpec,
  BarSeriesSpec,
  BasicSeriesSpec,
  DomainRange,
  LineSeriesSpec,
  Position,
  Rendering,
  Rotation,
} from '../lib/series/specs';
import { formatTooltip } from '../lib/series/tooltip';
import { LIGHT_THEME } from '../lib/themes/light_theme';
import { Theme } from '../lib/themes/theme';
import { computeChartDimensions, Dimensions } from '../lib/utils/dimensions';
import { Domain } from '../lib/utils/domain';
import { AxisId, GroupId, SpecId } from '../lib/utils/ids';
import { Scale, ScaleType } from '../lib/utils/scales/scales';
import {
  BrushExtent,
  computeBrushExtent,
  computeChartTransform,
  computeSeriesDomains,
  computeSeriesGeometries,
  findSelectedDataSeries,
  getAllDataSeriesColorValues,
  getAxesSpecForSpecId,
  getLegendItemByIndex,
  getUpdatedCustomSeriesColors,
  Transform,
  updateSelectedDataSeries,
} from './utils';

export interface TooltipPosition {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}
export interface TooltipData {
  value: GeometryValue;
  position: TooltipPosition;
}
export interface Point {
  x: number;
  y: number;
}
export interface SeriesDomainsAndData {
  xDomain: XDomain;
  yDomain: YDomain[];
  splittedDataSeries: RawDataSeries[][];
  formattedDataSeries: {
    stacked: FormattedDataSeries[];
    nonStacked: FormattedDataSeries[];
  };
  seriesColors: Map<string, DataSeriesColorsValues>;
}

export type ElementClickListener = (value: GeometryValue) => void;
export type ElementOverListener = (value: GeometryValue) => void;
export type BrushEndListener = (min: number, max: number) => void;
export type LegendItemListener = (dataSeriesIdentifiers: DataSeriesColorsValues | null) => void;
// const MAX_ANIMATABLE_GLYPHS = 500;

export class ChartStore {
  debug = false;
  specsInitialized = observable.box(false);
  initialized = observable.box(false);
  parentDimensions: Dimensions = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  }; // updated from jsx
  chartDimensions: Dimensions = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  }; // updated from jsx
  chartTransform: Transform = {
    x: 0,
    y: 0,
    rotate: 0,
  };
  brushExtent: BrushExtent = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  };

  chartRotation: Rotation = 0; // updated from jsx
  chartRendering: Rendering = 'canvas'; // updated from jsx
  chartTheme: Theme = LIGHT_THEME; // updated from jsx
  axesSpecs: Map<AxisId, AxisSpec> = new Map(); // readed from jsx
  axesTicksDimensions: Map<AxisId, AxisTicksDimensions> = new Map(); // computed
  axesPositions: Map<AxisId, Dimensions> = new Map(); // computed
  axesVisibleTicks: Map<AxisId, AxisTick[]> = new Map(); // computed
  axesTicks: Map<AxisId, AxisTick[]> = new Map(); // computed
  axesGridLinesPositions: Map<AxisId, AxisLinePosition[]> = new Map(); // computed

  seriesSpecs: Map<SpecId, BasicSeriesSpec> = new Map(); // readed from jsx

  seriesDomainsAndData?: SeriesDomainsAndData; // computed
  xScale?: Scale;
  yScales?: Map<GroupId, Scale>;
  xDomain?: Domain | DomainRange;

  legendItems: LegendItem[] = [];
  highlightedLegendItemIndex: IObservableValue<number | null> = observable.box(null);
  selectedLegendItemIndex: IObservableValue<number | null> = observable.box(null);
  selectedDataSeries: DataSeriesColorsValues[] | null = null;
  customSeriesColors: Map<string, string> = new Map();

  tooltipData = observable.box<Array<[any, any]> | null>(null);
  tooltipPosition = observable.box<{ x: number; y: number } | null>();
  showTooltip = observable.box(false);

  onElementClickListener?: ElementClickListener;
  onElementOverListener?: ElementOverListener;
  onElementOutListener?: () => undefined;
  onBrushEndListener?: BrushEndListener;
  onLegendItemOverListener?: LegendItemListener;
  onLegendItemOutListener?: () => undefined;
  onLegendItemClickListener?: LegendItemListener;
  onLegendItemPlusClickListener?: LegendItemListener;
  onLegendItemMinusClickListener?: LegendItemListener;
  onLegendItemVisibilityToggleClickListener?: LegendItemListener;

  geometries: {
    points: PointGeometry[];
    bars: BarGeometry[];
    areas: AreaGeometry[];
    lines: LineGeometry[];
  } | null = null;

  animateData = false;
  /**
   * Define if the chart can be animated or not depending
   * on the global configuration and on the number of elements per series
   */
  canDataBeAnimated = false;

  showLegend = observable.box(false);
  legendCollapsed = observable.box(false);
  legendPosition: Position | undefined;
  toggleLegendCollapsed = action(() => {
    this.legendCollapsed.set(!this.legendCollapsed.get());
    this.computeChart();
  });
  onOverElement = action((tooltip: TooltipData) => {
    if (this.onElementOverListener) {
      this.onElementOverListener(tooltip.value);
    }
    const { specId } = tooltip.value;
    const spec = this.seriesSpecs.get(specId);
    if (!spec) {
      return;
    }
    const { xAxis, yAxis } = getAxesSpecForSpecId(this.axesSpecs, spec.groupId);
    const formattedTooltip = formatTooltip(tooltip, spec, xAxis, yAxis);
    this.tooltipData.set(formattedTooltip);
    this.showTooltip.set(true);
    document.body.style.cursor = 'pointer';
  });

  onOutElement = action(() => {
    if (this.onElementOutListener) {
      this.onElementOutListener();
    }
    this.showTooltip.set(false);
    document.body.style.cursor = 'default';
  });

  setTooltipPosition = action((x: number, y: number) => {
    this.tooltipPosition.set({ x, y });
  });

  setShowLegend = action((showLegend: boolean) => {
    this.showLegend.set(showLegend);
  });

  highlightedLegendItem = computed(() => {
    const index = this.highlightedLegendItemIndex.get();
    return index == null ? null : this.legendItems[index];
  });

  selectedLegendItem = computed(() => {
    const index = this.selectedLegendItemIndex.get();
    return index == null ? null : this.legendItems[index];
  });

  onLegendItemOver = action((legendItemIndex: number) => {
    if (legendItemIndex >= this.legendItems.length || legendItemIndex < 0) {
      this.highlightedLegendItemIndex.set(null);
    } else {
      this.highlightedLegendItemIndex.set(legendItemIndex);
    }

    if (this.onLegendItemOverListener) {
      const currentLegendItem = this.highlightedLegendItem.get();
      const listenerData = currentLegendItem ? currentLegendItem.value : null;
      this.onLegendItemOverListener(listenerData);
    }
  });

  onLegendItemOut = action(() => {
    this.highlightedLegendItemIndex.set(null);
    if (this.onLegendItemOutListener) {
      this.onLegendItemOutListener();
    }
  });

  onLegendItemClick = action((legendItemIndex: number) => {
    if (legendItemIndex !== this.selectedLegendItemIndex.get()) {
      this.selectedLegendItemIndex.set(legendItemIndex);
    } else {
      this.selectedLegendItemIndex.set(null);
    }

    if (this.onLegendItemClickListener) {
      const currentLegendItem = this.selectedLegendItem.get();
      const listenerData = currentLegendItem ? currentLegendItem.value : null;
      this.onLegendItemClickListener(listenerData);
    }
  });

  onLegendItemPlusClick = action(() => {
    if (this.onLegendItemPlusClickListener) {
      const currentLegendItem = this.selectedLegendItem.get();
      const listenerData = currentLegendItem ? currentLegendItem.value : null;
      this.onLegendItemPlusClickListener(listenerData);
    }
  });

  onLegendItemMinusClick = action(() => {
    if (this.onLegendItemMinusClickListener) {
      const currentLegendItem = this.selectedLegendItem.get();
      const listenerData = currentLegendItem ? currentLegendItem.value : null;
      this.onLegendItemMinusClickListener(listenerData);
    }
  });

  toggleSingleSeries = action((legendItemIndex: number) => {
    const legendItem = getLegendItemByIndex(this.legendItems, legendItemIndex);

    if (legendItem) {
      if (findSelectedDataSeries(this.selectedDataSeries, legendItem.value) > -1) {
        this.selectedDataSeries =
          this.legendItems
            .filter((item: LegendItem, idx: number) => idx !== legendItemIndex)
            .map((item: LegendItem) => item.value);
      } else {
        this.selectedDataSeries = [legendItem.value];
      }

      this.computeChart();
    }
  });

  toggleSeriesVisibility = action((legendItemIndex: number) => {
    const legendItem = getLegendItemByIndex(this.legendItems, legendItemIndex);

    if (legendItem) {
      this.selectedDataSeries = updateSelectedDataSeries(this.selectedDataSeries, legendItem.value);
      this.computeChart();
    }
  });

  setSeriesColor = action((legendItemIndex: number, color: string) => {
    const legendItem = getLegendItemByIndex(this.legendItems, legendItemIndex);

    if (legendItem) {
      const { specId } = legendItem.value;

      const spec = this.seriesSpecs.get(specId);
      if (spec) {
        if (spec.customSeriesColors) {
          spec.customSeriesColors.set(legendItem.value, color);
        } else {
          const specCustomSeriesColors = new Map();
          spec.customSeriesColors = specCustomSeriesColors;
          spec.customSeriesColors.set(legendItem.value, color);
        }
      }

      this.computeChart();
    }
  });

  resetSelectedDataSeries() {
    this.selectedDataSeries = null;
  }

  setOnElementClickListener(listener: ElementClickListener) {
    this.onElementClickListener = listener;
  }
  setOnElementOverListener(listener: ElementOverListener) {
    this.onElementOverListener = listener;
  }
  setOnElementOutListener(listener: () => undefined) {
    this.onElementOutListener = listener;
  }
  setOnBrushEndListener(listener: BrushEndListener) {
    this.onBrushEndListener = listener;
  }
  setOnLegendItemOverListener(listener: LegendItemListener) {
    this.onLegendItemOverListener = listener;
  }
  setOnLegendItemOutListener(listener: () => undefined) {
    this.onLegendItemOutListener = listener;
  }
  setOnLegendItemClickListener(listener: LegendItemListener) {
    this.onLegendItemClickListener = listener;
  }
  setOnLegendItemPlusClickListener(listener: LegendItemListener) {
    this.onLegendItemPlusClickListener = listener;
  }
  setOnLegendItemMinusClickListener(listener: LegendItemListener) {
    this.onLegendItemMinusClickListener = listener;
  }
  removeElementClickListener() {
    this.onElementClickListener = undefined;
  }
  removeElementOverListener() {
    this.onElementOverListener = undefined;
  }
  removeElementOutListener() {
    this.onElementOutListener = undefined;
  }
  removeOnLegendItemOverListener() {
    this.onLegendItemOverListener = undefined;
  }
  removeOnLegendItemOutListener() {
    this.onLegendItemOutListener = undefined;
  }
  removeOnLegendItemPlusClickListener() {
    this.onLegendItemPlusClickListener = undefined;
  }
  removeOnLegendItemMinusClickListener() {
    this.onLegendItemMinusClickListener = undefined;
  }
  onBrushEnd(start: Point, end: Point) {
    if (!this.onBrushEndListener) {
      return;
    }
    const minValue = start.x < end.x ? start.x : end.x;
    const maxValue = start.x > end.x ? start.x : end.x;
    if (maxValue === minValue) {
      // if 0 size brush, avoid computing the value
      return;
    }
    const min = this.xScale!.invert(minValue - this.chartDimensions.left);
    const max = this.xScale!.invert(maxValue - this.chartDimensions.left);
    this.onBrushEndListener(min, max);
  }

  isBrushEnabled(): boolean {
    if (!this.xScale) {
      return false;
    }
    return this.xScale.type !== ScaleType.Ordinal && Boolean(this.onBrushEndListener);
  }

  updateParentDimensions(width: number, height: number, top: number, left: number) {
    let isChanged = false;
    if (width !== this.parentDimensions.width) {
      isChanged = true;
      this.parentDimensions.width = width;
    }
    if (height !== this.parentDimensions.height) {
      isChanged = true;
      this.parentDimensions.height = height;
    }
    if (top !== this.parentDimensions.top) {
      isChanged = true;
      this.parentDimensions.top = top;
    }
    if (left !== this.parentDimensions.left) {
      isChanged = true;
      this.parentDimensions.left = left;
    }
    if (isChanged) {
      this.computeChart();
    }
  }
  addSeriesSpec(seriesSpec: BasicSeriesSpec | LineSeriesSpec | AreaSeriesSpec | BarSeriesSpec) {
    this.seriesSpecs.set(seriesSpec.id, seriesSpec);
  }
  removeSeriesSpec(specId: SpecId) {
    this.seriesSpecs.delete(specId);
  }
  /**
   * Add an axis spec to the store
   * @param axisSpec an axis spec
   */
  addAxisSpec(axisSpec: AxisSpec) {
    this.axesSpecs.set(axisSpec.id, axisSpec);
  }
  removeAxisSpec(axisId: AxisId) {
    this.axesSpecs.delete(axisId);
  }

  computeChart() {
    this.initialized.set(false);
    // compute only if parent dimensions are computed
    if (this.parentDimensions.width === 0 || this.parentDimensions.height === 0) {
      return;
    }
    // avoid compute if no specs are specified
    if (this.seriesSpecs.size === 0) {
      return;
    }

    // When specs are not initialized, reset selectedDataSeries to null
    if (!this.specsInitialized.get()) {
      this.selectedDataSeries = null;
    }

    const domainsByGroupId = mergeDomainsByGroupId(this.axesSpecs, this.chartRotation);

    // The last argument is optional; if not supplied, then all series will be factored into computations
    // Otherwise, selectedDataSeries is used to restrict the computation for just the selected series
    const seriesDomains = computeSeriesDomains(
      this.seriesSpecs,
      domainsByGroupId,
      this.xDomain,
      this.selectedDataSeries,
    );
    this.seriesDomainsAndData = seriesDomains;

    // If this.selectedDataSeries is null, initialize with all series
    if (!this.selectedDataSeries) {
      this.selectedDataSeries = getAllDataSeriesColorValues(seriesDomains.seriesColors);
    }

    // Merge all series spec custom colors with state custom colors map
    const updatedCustomSeriesColors = getUpdatedCustomSeriesColors(this.seriesSpecs);
    this.customSeriesColors = new Map([...this.customSeriesColors, ...updatedCustomSeriesColors]);

    // tslint:disable-next-line:no-console
    // console.log({colors: seriesDomains.seriesColors});

    // tslint:disable-next-line:no-console
    // console.log({ seriesDomains });
    const seriesColorMap = getSeriesColorMap(
      seriesDomains.seriesColors,
      this.chartTheme.colors,
      this.customSeriesColors,
    );

    this.legendItems = computeLegend(
      seriesDomains.seriesColors,
      seriesColorMap,
      this.seriesSpecs,
      this.chartTheme.colors.defaultVizColor,
      this.selectedDataSeries,
    );
    // tslint:disable-next-line:no-console
    // console.log({ legendItems: this.legendItems });

    const {
      xDomain,
      yDomain,
      formattedDataSeries: { stacked, nonStacked },
    } = seriesDomains;
    // compute how many series are clustered
    const { totalGroupCount } = countClusteredSeries(stacked, nonStacked);

    // compute axis dimensions
    const bboxCalculator = new CanvasTextBBoxCalculator();
    this.axesTicksDimensions.clear();
    this.axesSpecs.forEach((axisSpec) => {
      const { id } = axisSpec;
      const dimensions = computeAxisTicksDimensions(
        axisSpec,
        xDomain,
        yDomain,
        totalGroupCount,
        bboxCalculator,
        this.chartRotation,
        this.chartTheme.axes,
      );
      if (dimensions) {
        this.axesTicksDimensions.set(id, dimensions);
      }
    });
    bboxCalculator.destroy();

    // // compute chart dimensions
    this.chartDimensions = computeChartDimensions(
      this.parentDimensions,
      this.chartTheme,
      this.axesTicksDimensions,
      this.axesSpecs,
      this.showLegend.get() && !this.legendCollapsed.get(),
      this.legendPosition,
    );

    this.chartTransform = computeChartTransform(this.chartDimensions, this.chartRotation);
    this.brushExtent = computeBrushExtent(
      this.chartDimensions,
      this.chartRotation,
      this.chartTransform,
    );

    const seriesGeometries = computeSeriesGeometries(
      this.seriesSpecs,
      seriesDomains.xDomain,
      seriesDomains.yDomain,
      seriesDomains.formattedDataSeries,
      seriesColorMap,
      this.chartTheme.colors,
      this.chartDimensions,
      this.chartRotation,
    );

    // tslint:disable-next-line:no-console
    // console.log({ seriesGeometries });
    this.geometries = seriesGeometries.geometries;
    this.xScale = seriesGeometries.scales.xScale;
    this.yScales = seriesGeometries.scales.yScales;

    // // compute visible ticks and their positions
    const axisTicksPositions = getAxisTicksPositions(
      this.chartDimensions,
      this.chartTheme,
      this.chartRotation,
      this.showLegend.get() && !this.legendCollapsed.get(),
      this.axesSpecs,
      this.axesTicksDimensions,
      seriesDomains.xDomain,
      seriesDomains.yDomain,
      totalGroupCount,
      this.legendPosition,
    );
    // tslint:disable-next-line:no-console
    // console.log({axisTicksPositions});
    this.axesPositions = axisTicksPositions.axisPositions;
    this.axesTicks = axisTicksPositions.axisTicks;
    this.axesVisibleTicks = axisTicksPositions.axisVisibleTicks;
    this.axesGridLinesPositions = axisTicksPositions.axisGridLinesPositions;
    // if (glyphsCount > MAX_ANIMATABLE_GLYPHS) {
    //   this.canDataBeAnimated = false;
    // } else {
    //   this.canDataBeAnimated = this.animateData;
    // }
    this.canDataBeAnimated = true;

    this.initialized.set(true);
  }
}
