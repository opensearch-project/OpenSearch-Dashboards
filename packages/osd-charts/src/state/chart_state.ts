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
  IndexedGeometry,
  isPointOnGeometry as isPointerOnGeometry,
  LineGeometry,
  PointGeometry,
} from '../lib/series/rendering';
import { countBarsInCluster } from '../lib/series/scales';
import {
  DataSeriesColorsValues,
  FormattedDataSeries,
  getSeriesColorMap,
  RawDataSeries,
} from '../lib/series/series';
import {
  AnnotationSpec,
  AnnotationTypes,
  AreaSeriesSpec,
  AxisSpec,
  BarSeriesSpec,
  BasicSeriesSpec,
  DomainRange,
  isLineAnnotation,
  isRectAnnotation,
  LineSeriesSpec,
  Position,
  Rendering,
  Rotation,
} from '../lib/series/specs';
import { formatTooltip, getSeriesTooltipValues } from '../lib/series/tooltip';
import { LIGHT_THEME } from '../lib/themes/light_theme';
import { mergeWithDefaultAnnotationLine, mergeWithDefaultAnnotationRect, Theme } from '../lib/themes/theme';
import { compareByValueAsc } from '../lib/utils/commons';
import { computeChartDimensions, Dimensions } from '../lib/utils/dimensions';
import { Domain } from '../lib/utils/domain';
import { AnnotationId, AxisId, GroupId, SpecId } from '../lib/utils/ids';
import {
  areIndexedGeometryArraysEquals,
  getValidXPosition,
  getValidYPosition,
  isCrosshairTooltipType,
  isFollowTooltipType,
  TooltipType,
  TooltipValue,
} from '../lib/utils/interactions';
import { Scale, ScaleType } from '../lib/utils/scales/scales';
import { DEFAULT_TOOLTIP_SNAP, DEFAULT_TOOLTIP_TYPE } from '../specs/settings';
import {
  AnnotationDimensions,
  computeAnnotationDimensions,
  computeAnnotationTooltipState,
} from './annotation_utils';
import {
  getCursorBandPosition,
  getCursorLinePosition,
  getTooltipPosition,
} from './crosshair_utils';
import {
  BrushExtent,
  computeBrushExtent,
  computeChartTransform,
  computeSeriesDomains,
  computeSeriesGeometries,
  findDataSeriesByColorValues,
  getAxesSpecForSpecId,
  getUpdatedCustomSeriesColors,
  isChartAnimatable,
  isLineAreaOnlyChart,
  Transform,
  updateDeselectedDataSeries,
} from './utils';

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

export type ElementClickListener = (values: GeometryValue[]) => void;
export type ElementOverListener = (values: GeometryValue[]) => void;
export type BrushEndListener = (min: number, max: number) => void;
export type LegendItemListener = (dataSeriesIdentifiers: DataSeriesColorsValues | null) => void;

export class ChartStore {
  debug = false;
  specsInitialized = observable.box(false);
  initialized = observable.box(false);
  parentDimensions: Dimensions = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  };
  chartDimensions: Dimensions = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  };
  chartTransform: Transform = {
    x: 0,
    y: 0,
    rotate: 0,
  };
  isBrushing = observable.box(false);
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

  annotationSpecs = new Map<AnnotationId, AnnotationSpec>(); // read from jsx

  annotationDimensions = observable.map<AnnotationId, AnnotationDimensions>(new Map());

  seriesSpecs: Map<SpecId, BasicSeriesSpec> = new Map(); // readed from jsx

  seriesDomainsAndData?: SeriesDomainsAndData; // computed
  xScale?: Scale;
  yScales?: Map<GroupId, Scale>;
  xDomain?: Domain | DomainRange;

  legendItems: Map<string, LegendItem> = new Map();
  highlightedLegendItemKey: IObservableValue<string | null> = observable.box(null);
  selectedLegendItemKey: IObservableValue<string | null> = observable.box(null);
  deselectedDataSeries: DataSeriesColorsValues[] | null = null;
  customSeriesColors: Map<string, string> = new Map();
  seriesColorMap: Map<string, string> = new Map();
  totalBarsInCluster?: number;

  tooltipData = observable.array<TooltipValue>([], { deep: false });
  tooltipType = observable.box(DEFAULT_TOOLTIP_TYPE);
  tooltipSnap = observable.box(DEFAULT_TOOLTIP_SNAP);
  tooltipPosition = observable.object<{ transform: string }>({ transform: '' });

  /** cursorPosition is used by tooltip, so this is a way to expose the position for other uses */
  rawCursorPosition = observable.object<{ x: number; y: number }>({ x: -1, y: -1 }, undefined, {
    deep: false,
  });

  /** position of the cursor relative to the chart */
  cursorPosition = observable.object<{ x: number; y: number }>({ x: -1, y: -1 }, undefined, {
    deep: false,
  });
  cursorBandPosition = observable.object<Dimensions>(
    { top: -1, left: -1, height: -1, width: -1 },
    undefined,
    {
      deep: false,
    },
  );
  cursorLinePosition = observable.object<Dimensions>(
    { top: -1, left: -1, height: -1, width: -1 },
    undefined,
    {
      deep: false,
    },
  );

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

  geometriesIndex: Map<any, IndexedGeometry[]> = new Map();
  geometriesIndexKeys: any[] = [];
  highlightedGeometries = observable.array<IndexedGeometry>([], { deep: false });

  animateData = false;
  /**
   * Define if the chart can be animated or not depending
   * on the global configuration and on the number of elements per series
   */
  canDataBeAnimated = false;

  showLegend = observable.box(false);
  legendCollapsed = observable.box(false);
  legendPosition: Position | undefined;
  showLegendDisplayValue = observable.box(true);

  toggleLegendCollapsed = action(() => {
    this.legendCollapsed.set(!this.legendCollapsed.get());
    this.computeChart();
  });

  /**
   * x and y values are relative to the container.
   */
  setCursorPosition = action((x: number, y: number) => {
    this.rawCursorPosition.x = x;
    this.rawCursorPosition.y = y;

    if (!this.seriesDomainsAndData || this.tooltipType.get() === TooltipType.None) {
      return;
    }

    // get positions relative to chart
    let xPos = x - this.chartDimensions.left;
    let yPos = y - this.chartDimensions.top;

    // limit cursorPosition to chartDimensions
    // note: to debug and inspect tooltip html, just comment the following ifs
    if (xPos < 0 || xPos >= this.chartDimensions.width) {
      xPos = -1;
    }
    if (yPos < 0 || yPos >= this.chartDimensions.height) {
      yPos = -1;
    }
    this.cursorPosition.x = xPos;
    this.cursorPosition.y = yPos;

    // hide tooltip if outside chart dimensions
    if (yPos === -1 || xPos === -1) {
      this.clearTooltipAndHighlighted();
      return;
    }

    // get the cursor position depending on the chart rotation
    const xAxisCursorPosition = getValidXPosition(
      xPos,
      yPos,
      this.chartRotation,
      this.chartDimensions,
    );
    const yAxisCursorPosition = getValidYPosition(
      xPos,
      yPos,
      this.chartRotation,
      this.chartDimensions,
    );

    // only if we have a valid cursor position and the necessary scale
    if (xAxisCursorPosition < 0 || !this.xScale || !this.yScales) {
      this.clearTooltipAndHighlighted();
      return;
    }

    // invert the cursor position to get the scale value

    const xValue = this.xScale.invertWithStep(xAxisCursorPosition, this.geometriesIndexKeys);

    // update che cursorBandPosition based on chart configuration
    const isLineAreaOnly = isLineAreaOnlyChart(this.seriesSpecs);
    const updatedCursorBand = getCursorBandPosition(
      this.chartRotation,
      this.chartDimensions,
      { x: xAxisCursorPosition, y: yAxisCursorPosition},
      this.isTooltipSnapEnabled.get(),
      this.xScale,
      this.geometriesIndexKeys,
      isLineAreaOnly ? 1 : this.totalBarsInCluster,
    );
    if (updatedCursorBand === undefined) {
      this.clearTooltipAndHighlighted();
      return;
    }
    Object.assign(this.cursorBandPosition, updatedCursorBand);

    const updatedCursorLine = getCursorLinePosition(
      this.chartRotation,
      this.chartDimensions,
      this.cursorPosition,
    );
    Object.assign(this.cursorLinePosition, updatedCursorLine);

    const updatedTooltipPosition = getTooltipPosition(
      this.chartDimensions,
      this.chartRotation,
      this.cursorBandPosition,
      this.cursorPosition,
    );

    this.tooltipPosition.transform = updatedTooltipPosition.transform;

    // get the elements on at this cursor position
    const elements = this.geometriesIndex.get(xValue);

    // if no element, hide everything
    if (!elements || elements.length === 0) {
      this.clearTooltipAndHighlighted();
      return;
    }

    // build the tooltip value list
    let xValueInfo: TooltipValue | null = null;
    let oneHighlighted = false;
    const newHighlightedGeometries: IndexedGeometry[] = [];
    const tooltipValues = elements.reduce(
      (acc, indexedGeometry) => {
        const {
          geometryId: { specId },
        } = indexedGeometry;
        const spec = this.seriesSpecs.get(specId);

        // safe guard check
        if (!spec) {
          return acc;
        }
        const { xAxis, yAxis } = getAxesSpecForSpecId(this.axesSpecs, spec.groupId);

        // yScales is ensured by the enclosing if
        const yScale = this.yScales!.get(spec.groupId);
        if (!yScale) {
          return acc;
        }

        // check if the pointer is on the geometry
        let isHighlighted = false;
        if (isPointerOnGeometry(xAxisCursorPosition, yAxisCursorPosition, indexedGeometry)) {
          isHighlighted = true;
          oneHighlighted = true;
          newHighlightedGeometries.push(indexedGeometry);
        }

        // if it's a follow tooltip, and no element is highlighted
        // not add that element into the tooltip list
        if (!isHighlighted && isFollowTooltipType(this.tooltipType.get())) {
          return acc;
        }

        // format the tooltip values
        const formattedTooltip = formatTooltip(indexedGeometry, spec, false, isHighlighted, yAxis);

        // format only one time the x value
        if (!xValueInfo) {
          xValueInfo = formatTooltip(indexedGeometry, spec, true, false, xAxis);
          return [xValueInfo, ...acc, formattedTooltip];
        }

        return [...acc, formattedTooltip];
      },
      [] as TooltipValue[],
    );

    // if there's an annotation rect tooltip & there isn't a single highlighted element, hide
    const annotationTooltip = this.annotationTooltipState.get();
    const hasRectAnnotationToolip = annotationTooltip && annotationTooltip.annotationType === AnnotationTypes.Rectangle;
    if (hasRectAnnotationToolip && !oneHighlighted) {
      this.clearTooltipAndHighlighted();
      return;
    }

    // check if we already have send out an over/out event on highlighted elements
    if (
      this.onElementOverListener &&
      !areIndexedGeometryArraysEquals(newHighlightedGeometries, this.highlightedGeometries.toJS())
    ) {
      if (newHighlightedGeometries.length > 0) {
        this.onElementOverListener(newHighlightedGeometries.map(({ value }) => value));
      } else {
        if (this.onElementOutListener) {
          this.onElementOutListener();
        }
      }
    }

    // update highlighted geometries observer
    this.highlightedGeometries.replace(newHighlightedGeometries);

    // update tooltip visibility
    if (tooltipValues.length === 0) {
      this.tooltipData.clear();
    } else {
      this.tooltipData.replace(tooltipValues);
    }

    // TODO move this into the renderer
    if (oneHighlighted) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  });

  legendItemTooltipValues = computed(() => {
    // update legend items with value to display
    return getSeriesTooltipValues(this.tooltipData);
  });

  annotationTooltipState = computed(() => {
    // get positions relative to chart
    const xPos = this.rawCursorPosition.x - this.chartDimensions.left;
    const yPos = this.rawCursorPosition.y - this.chartDimensions.top;

    // only if we have a valid cursor position and the necessary scale
    if (!this.xScale || !this.yScales) {
      return null;
    }

    const cursorPosition = {
      x: xPos,
      y: yPos,
    };

    const tooltipState = computeAnnotationTooltipState(
      cursorPosition,
      this.annotationDimensions,
      this.annotationSpecs,
      this.chartRotation,
      this.axesSpecs,
      this.chartDimensions,
    );

    // If there's a highlighted chart element tooltip value, don't show annotation tooltip
    if (tooltipState && tooltipState.annotationType === AnnotationTypes.Rectangle) {
      for (const tooltipValue of this.tooltipData) {
        if (tooltipValue.isHighlighted) {
          return null;
        }
      }
    }

    return tooltipState;
  });

  isTooltipVisible = computed(() => {
    return (
      !this.isBrushing.get() &&
      this.tooltipType.get() !== TooltipType.None &&
      this.cursorPosition.x > -1 &&
      this.cursorPosition.y > -1 &&
      this.tooltipData.length > 0
    );
  });
  isCrosshairVisible = computed(() => {
    return (
      !this.isBrushing.get() &&
      isCrosshairTooltipType(this.tooltipType.get()) &&
      this.cursorPosition.x > -1 &&
      this.cursorPosition.y > -1
    );
  });

  isTooltipSnapEnabled = computed(() => {
    return (this.xScale && this.xScale.bandwidth > 0) || this.tooltipSnap.get();
  });

  clearTooltipAndHighlighted = action(() => {
    // if exist any highlighted geometry, send an out element event
    if (this.onElementOutListener && this.highlightedGeometries.length > 0) {
      this.onElementOutListener();
    }
    // clear highlight geoms
    this.highlightedGeometries.clear();
    this.tooltipData.clear();

    document.body.style.cursor = 'default';
  });

  setShowLegend = action((showLegend: boolean) => {
    this.showLegend.set(showLegend);
  });

  highlightedLegendItem = computed(() => {
    const key = this.highlightedLegendItemKey.get();
    return key == null ? null : this.legendItems.get(key);
  });

  selectedLegendItem = computed(() => {
    const key = this.selectedLegendItemKey.get();
    return key == null ? null : this.legendItems.get(key);
  });

  onLegendItemOver = action((legendItemKey: string | null) => {
    this.highlightedLegendItemKey.set(legendItemKey);

    if (this.onLegendItemOverListener) {
      const currentLegendItem = this.highlightedLegendItem.get();
      const listenerData = currentLegendItem ? currentLegendItem.value : null;
      this.onLegendItemOverListener(listenerData);
    }
  });

  onLegendItemOut = action(() => {
    this.highlightedLegendItemKey.set(null);
    if (this.onLegendItemOutListener) {
      this.onLegendItemOutListener();
    }
  });

  onLegendItemClick = action((legendItemKey: string) => {
    if (legendItemKey !== this.selectedLegendItemKey.get()) {
      this.selectedLegendItemKey.set(legendItemKey);
    } else {
      this.selectedLegendItemKey.set(null);
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

  toggleSingleSeries = action((legendItemKey: string) => {
    const legendItem = this.legendItems.get(legendItemKey);

    if (legendItem) {
      if (findDataSeriesByColorValues(this.deselectedDataSeries, legendItem.value) > -1) {
        this.deselectedDataSeries = [...this.legendItems.values()]
          .filter((item: LegendItem) => item.key !== legendItemKey)
          .map((item: LegendItem) => item.value);
      } else {
        this.deselectedDataSeries = [legendItem.value];
      }

      this.computeChart();
    }
  });

  toggleSeriesVisibility = action((legendItemKey: string) => {
    const legendItem = this.legendItems.get(legendItemKey);

    if (legendItem) {
      this.deselectedDataSeries = updateDeselectedDataSeries(
        this.deselectedDataSeries,
        legendItem.value,
      );
      this.computeChart();
    }
  });

  setSeriesColor = action((legendItemKey: string, color: string) => {
    const legendItem = this.legendItems.get(legendItemKey);

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

  onBrushStart = action(() => {
    if (!this.onBrushEndListener) {
      return;
    }
    this.isBrushing.set(true);
  });

  onBrushEnd = action((start: Point, end: Point) => {
    if (!this.onBrushEndListener) {
      return;
    }
    this.isBrushing.set(false);
    const minValue = start.x < end.x ? start.x : end.x;
    const maxValue = start.x > end.x ? start.x : end.x;
    if (maxValue === minValue) {
      // if 0 size brush, avoid computing the value
      return;
    }
    const min = this.xScale!.invert(minValue - this.chartDimensions.left);
    const max = this.xScale!.invert(maxValue - this.chartDimensions.left);
    this.onBrushEndListener(min, max);
  });

  handleChartClick() {
    if (this.highlightedGeometries.length > 0 && this.onElementClickListener) {
      this.onElementClickListener(this.highlightedGeometries.toJS().map(({ value }) => value));
    }
  }

  resetDeselectedDataSeries() {
    this.deselectedDataSeries = null;
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

  addAnnotationSpec(annotationSpec: AnnotationSpec) {
    if (isLineAnnotation(annotationSpec)) {
      const { style } = annotationSpec;

      const mergedLineStyle = mergeWithDefaultAnnotationLine(style);
      annotationSpec.style = mergedLineStyle;
    }
    if (isRectAnnotation(annotationSpec)) {
      const { style } = annotationSpec;

      const mergedRectStyle = mergeWithDefaultAnnotationRect(style);
      annotationSpec.style = mergedRectStyle;
    }
    this.annotationSpecs.set(annotationSpec.annotationId, annotationSpec);
  }

  removeAnnotationSpec(annotationId: AnnotationId) {
    this.annotationSpecs.delete(annotationId);
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
      this.deselectedDataSeries = null;
    }

    const domainsByGroupId = mergeDomainsByGroupId(this.axesSpecs, this.chartRotation);

    // The last argument is optional; if not supplied, then all series will be factored into computations
    // Otherwise, deselectedDataSeries is used to restrict the computation excluding the deselected series
    const seriesDomains = computeSeriesDomains(
      this.seriesSpecs,
      domainsByGroupId,
      this.xDomain,
      this.deselectedDataSeries,
    );

    this.seriesDomainsAndData = seriesDomains;

    // Merge all series spec custom colors with state custom colors map
    const updatedCustomSeriesColors = getUpdatedCustomSeriesColors(this.seriesSpecs);
    this.customSeriesColors = new Map([...this.customSeriesColors, ...updatedCustomSeriesColors]);

    // tslint:disable-next-line:no-console
    // console.log({ colors: seriesDomains.seriesColors });

    // tslint:disable-next-line:no-console
    // console.log({ seriesDomains });
    this.seriesColorMap = getSeriesColorMap(
      seriesDomains.seriesColors,
      this.chartTheme.colors,
      this.customSeriesColors,
    );

    this.legendItems = computeLegend(
      seriesDomains.seriesColors,
      this.seriesColorMap,
      this.seriesSpecs,
      this.chartTheme.colors.defaultVizColor,
      this.axesSpecs,
      this.deselectedDataSeries,
    );

    // tslint:disable-next-line:no-console
    // console.log({ legendItems: this.legendItems });

    const {
      xDomain,
      yDomain,
      formattedDataSeries: { stacked, nonStacked },
    } = seriesDomains;

    // compute how many bar series are clustered
    const { totalBarsInCluster } = countBarsInCluster(stacked, nonStacked);
    this.totalBarsInCluster = totalBarsInCluster;

    // compute axis dimensions
    const bboxCalculator = new CanvasTextBBoxCalculator();
    this.axesTicksDimensions.clear();
    this.axesSpecs.forEach((axisSpec) => {
      const { id } = axisSpec;
      const dimensions = computeAxisTicksDimensions(
        axisSpec,
        xDomain,
        yDomain,
        totalBarsInCluster,
        bboxCalculator,
        this.chartRotation,
        this.chartTheme.axes,
        this.chartTheme.scales.barsPadding,
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
      this.seriesColorMap,
      this.chartTheme,
      this.chartDimensions,
      this.chartRotation,
      this.axesSpecs,
    );

    // tslint:disable-next-line:no-console
    // console.log({ seriesGeometries });
    this.geometries = seriesGeometries.geometries;
    this.xScale = seriesGeometries.scales.xScale;
    this.yScales = seriesGeometries.scales.yScales;
    this.geometriesIndex = seriesGeometries.geometriesIndex;
    this.geometriesIndexKeys = [...this.geometriesIndex.keys()].sort(compareByValueAsc);

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
      totalBarsInCluster,
      this.legendPosition,
      this.chartTheme.scales.barsPadding,
    );
    // tslint:disable-next-line:no-console
    // console.log({axisTicksPositions});
    this.axesPositions = axisTicksPositions.axisPositions;
    this.axesTicks = axisTicksPositions.axisTicks;
    this.axesVisibleTicks = axisTicksPositions.axisVisibleTicks;
    this.axesGridLinesPositions = axisTicksPositions.axisGridLinesPositions;

    // annotation computations
    const updatedAnnotationDimensions = computeAnnotationDimensions(
      this.annotationSpecs,
      this.chartDimensions,
      this.chartRotation,
      this.yScales,
      this.xScale,
      this.axesSpecs,
    );

    this.annotationDimensions.replace(updatedAnnotationDimensions);

    this.canDataBeAnimated = isChartAnimatable(seriesGeometries.geometriesCounts, this.animateData);
    // temporary disabled until
    // https://github.com/elastic/elastic-charts/issues/89 and https://github.com/elastic/elastic-charts/issues/41
    this.canDataBeAnimated = false;
    this.initialized.set(true);
  }
}
