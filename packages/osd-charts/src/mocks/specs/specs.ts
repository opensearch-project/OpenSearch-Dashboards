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

import { mergePartial, Position, RecursivePartial } from '../../utils/commons';
import {
  SeriesSpecs,
  DEFAULT_GLOBAL_ID,
  BarSeriesSpec,
  AreaSeriesSpec,
  HistogramModeAlignments,
  HistogramBarSeriesSpec,
  LineSeriesSpec,
  BasicSeriesSpec,
  SeriesTypes,
  BubbleSeriesSpec,
  LineAnnotationSpec,
  RectAnnotationSpec,
  AnnotationTypes,
  AnnotationDomainTypes,
  AxisSpec,
} from '../../chart_types/xy_chart/utils/specs';
import { ScaleType } from '../../scales';
import { ChartTypes } from '../../chart_types';
import { SettingsSpec, SpecTypes, TooltipType } from '../../specs';
import { LIGHT_THEME } from '../../utils/themes/light_theme';
import { PartitionSpec } from '../../chart_types/partition_chart/specs';
import { config, percentFormatter } from '../../chart_types/partition_chart/layout/config/config';
import { ShapeTreeNode } from '../../chart_types/partition_chart/layout/types/viewmodel_types';
import { Datum } from '../../utils/commons';
import { AGGREGATE_KEY, PrimitiveValue } from '../../chart_types/partition_chart/layout/utils/group_by_rollup';
import { PartitionLayout } from '../../chart_types/partition_chart/layout/types/config_types';

/** @internal */
export class MockSeriesSpec {
  private static readonly barBase: BarSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: 'spec1',
    seriesType: SeriesTypes.Bar,
    groupId: DEFAULT_GLOBAL_ID,
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    enableHistogramMode: false,
    stackAsPercentage: false,
    data: [] as any[],
  };

  private static readonly histogramBarBase: HistogramBarSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: 'spec1',
    seriesType: SeriesTypes.Bar,
    groupId: DEFAULT_GLOBAL_ID,
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    enableHistogramMode: true,
    data: [],
  };

  private static readonly areaBase: AreaSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: 'spec1',
    seriesType: SeriesTypes.Area,
    groupId: DEFAULT_GLOBAL_ID,
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    histogramModeAlignment: HistogramModeAlignments.Center,
    data: [],
  };

  private static readonly lineBase: LineSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: 'spec1',
    seriesType: SeriesTypes.Line,
    groupId: DEFAULT_GLOBAL_ID,
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    histogramModeAlignment: HistogramModeAlignments.Center,
    data: [],
  };

  private static readonly bubbleBase: BubbleSeriesSpec = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Series,
    id: 'spec1',
    seriesType: SeriesTypes.Bubble,
    groupId: DEFAULT_GLOBAL_ID,
    xScaleType: ScaleType.Ordinal,
    yScaleType: ScaleType.Linear,
    xAccessor: 'x',
    yAccessors: ['y'],
    yScaleToDataExtent: false,
    hideInLegend: false,
    data: [],
  };

  private static readonly sunburstBase: PartitionSpec = {
    chartType: ChartTypes.Partition,
    specType: SpecTypes.Series,
    id: 'spec1',
    config: {
      ...config,
      partitionLayout: PartitionLayout.sunburst,
    },
    valueAccessor: (d: Datum) => (typeof d === 'number' ? d : 0),
    valueGetter: (n: ShapeTreeNode): number => n[AGGREGATE_KEY],
    valueFormatter: (d: number): string => String(d),
    percentFormatter,
    topGroove: 0,
    layers: [
      {
        groupByRollup: (d: Datum, i: number) => i,
        nodeLabel: (d: PrimitiveValue) => String(d),
        showAccessor: () => true,
        fillLabel: {},
      },
    ],
    data: [],
  };

  private static readonly treemapBase: PartitionSpec = {
    chartType: ChartTypes.Partition,
    specType: SpecTypes.Series,
    id: 'spec1',
    config: {
      ...config,
      partitionLayout: PartitionLayout.treemap,
    },
    valueAccessor: (d: Datum) => (typeof d === 'number' ? d : 0),
    valueGetter: (n: ShapeTreeNode): number => n[AGGREGATE_KEY],
    valueFormatter: (d: number): string => String(d),
    percentFormatter,
    topGroove: 20,
    layers: [
      {
        groupByRollup: (d: Datum, i: number) => i,
        nodeLabel: (d: PrimitiveValue) => String(d),
        showAccessor: () => true,
        fillLabel: {},
      },
    ],
    data: [],
  };

  static bar(partial?: Partial<BarSeriesSpec>): BarSeriesSpec {
    return mergePartial<BarSeriesSpec>(MockSeriesSpec.barBase, partial as RecursivePartial<BarSeriesSpec>, {
      mergeOptionalPartialValues: true,
    });
  }

  static histogramBar(partial?: Partial<HistogramBarSeriesSpec>): HistogramBarSeriesSpec {
    return mergePartial<HistogramBarSeriesSpec>(
      MockSeriesSpec.histogramBarBase,
      partial as RecursivePartial<HistogramBarSeriesSpec>,
      {
        mergeOptionalPartialValues: true,
      },
    );
  }

  static area(partial?: Partial<AreaSeriesSpec>): AreaSeriesSpec {
    return mergePartial<AreaSeriesSpec>(MockSeriesSpec.areaBase, partial as RecursivePartial<AreaSeriesSpec>, {
      mergeOptionalPartialValues: true,
    });
  }

  static line(partial?: Partial<LineSeriesSpec>): LineSeriesSpec {
    return mergePartial<LineSeriesSpec>(MockSeriesSpec.lineBase, partial as RecursivePartial<LineSeriesSpec>, {
      mergeOptionalPartialValues: true,
    });
  }

  static sunburst(partial?: Partial<PartitionSpec>): PartitionSpec {
    return mergePartial<PartitionSpec>(MockSeriesSpec.sunburstBase, partial as RecursivePartial<PartitionSpec>, {
      mergeOptionalPartialValues: true,
    });
  }

  static treemap(partial?: Partial<PartitionSpec>): PartitionSpec {
    return mergePartial<PartitionSpec>(MockSeriesSpec.treemapBase, partial as RecursivePartial<PartitionSpec>, {
      mergeOptionalPartialValues: true,
    });
  }

  static byType(type?: SeriesTypes | 'histogram'): BasicSeriesSpec {
    switch (type) {
      case SeriesTypes.Line:
        return MockSeriesSpec.lineBase;
      case SeriesTypes.Area:
        return MockSeriesSpec.areaBase;
      case SeriesTypes.Bubble:
        return MockSeriesSpec.bubbleBase;
      case 'histogram':
        return MockSeriesSpec.histogramBarBase;
      case SeriesTypes.Bar:
      default:
        return MockSeriesSpec.barBase;
    }
  }
  static byTypePartial(type?: 'line' | 'bar' | 'area' | 'histogram') {
    switch (type) {
      case 'line':
        return MockSeriesSpec.line;
      case 'area':
        return MockSeriesSpec.area;
      case 'histogram':
        return MockSeriesSpec.histogramBar;
      case 'bar':
      default:
        return MockSeriesSpec.bar;
    }
  }
}

export class MockSeriesSpecs {
  static fromSpecs(specs: BasicSeriesSpec[]): SeriesSpecs {
    return specs;
  }

  static fromPartialSpecs(specs: Partial<BasicSeriesSpec>[]): SeriesSpecs {
    return specs.map(({ seriesType, ...spec }) => {
      const base = MockSeriesSpec.byType(seriesType);
      return mergePartial<BasicSeriesSpec>(base, spec as RecursivePartial<BasicSeriesSpec>, {
        mergeOptionalPartialValues: true,
      });
    });
  }

  static empty(): SeriesSpecs {
    return [];
  }
}

/** @internal */
export class MockGlobalSpec {
  private static readonly settingsBase: SettingsSpec = {
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
      type: TooltipType.VerticalCursor,
      snap: true,
    },
    legendPosition: Position.Right,
    showLegendExtra: true,
    hideDuplicateAxes: false,
    theme: LIGHT_THEME,
  };

  private static readonly axisBase: AxisSpec = {
    id: 'yAxis',
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Axis,
    groupId: DEFAULT_GLOBAL_ID,
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    tickSize: 10,
    tickPadding: 10,
    tickFormat: (tick: any) => `${tick}`,
    tickLabelRotation: 0,
  };

  private static readonly settingsBaseNoMargings: SettingsSpec = {
    ...MockGlobalSpec.settingsBase,
    theme: {
      ...LIGHT_THEME,
      chartMargins: { top: 0, left: 0, right: 0, bottom: 0 },
      chartPaddings: { top: 0, left: 0, right: 0, bottom: 0 },
      scales: {
        barsPadding: 0,
        histogramPadding: 0,
      },
    },
  };

  static settings(partial?: Partial<SettingsSpec>): SettingsSpec {
    return mergePartial<SettingsSpec>(MockGlobalSpec.settingsBase, partial, { mergeOptionalPartialValues: true });
  }
  static settingsNoMargins(partial?: Partial<SettingsSpec>): SettingsSpec {
    return mergePartial<SettingsSpec>(MockGlobalSpec.settingsBaseNoMargings, partial, {
      mergeOptionalPartialValues: true,
    });
  }
  static axis(partial?: Partial<AxisSpec>): AxisSpec {
    return mergePartial<AxisSpec>(MockGlobalSpec.axisBase, partial, { mergeOptionalPartialValues: true });
  }
}

/** @internal */
export class MockAnnotationSpec {
  private static readonly lineBase: LineAnnotationSpec = {
    id: 'line_annotation_1',
    groupId: DEFAULT_GLOBAL_ID,
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Annotation,
    annotationType: AnnotationTypes.Line,
    dataValues: [],
    domainType: AnnotationDomainTypes.XDomain,
  };

  private static readonly rectBase: RectAnnotationSpec = {
    id: 'rect_annotation_1',
    groupId: DEFAULT_GLOBAL_ID,
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Annotation,
    annotationType: AnnotationTypes.Rectangle,
    dataValues: [],
  };

  static line(partial?: Partial<LineAnnotationSpec>): LineAnnotationSpec {
    return mergePartial<LineAnnotationSpec>(MockAnnotationSpec.lineBase, partial, { mergeOptionalPartialValues: true });
  }
  static rect(partial?: Partial<RectAnnotationSpec>): RectAnnotationSpec {
    return mergePartial<RectAnnotationSpec>(MockAnnotationSpec.rectBase, partial, { mergeOptionalPartialValues: true });
  }
}
