import { Margins } from '../utils/dimensions';

export interface ChartConfig {
  /* Space btw parent DOM element and first available element of the chart (axis
   * if exists, else the chart itself)
   */
  margins: Margins;

  /* Space btw the chart geometries and axis; if no axis, pads space btw chart & container */
  paddings: Margins;
  styles: {
    lineSeries: LineSeriesStyle;
    areaSeries: AreaSeriesStyle;
  };
}
export interface AxisConfig {
  tickFontSize: number;
  tickFontFamily: string;
  tickFontStyle: string;
  titleFontSize: number;
  titleFontFamily: string;
  titleFontStyle: string;
  titlePadding: number;
}
export interface GridLineConfig {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: number[];
}
export interface ScalesConfig {
  ordinal: {
    padding: number;
  };
}
export interface ColorConfig {
  vizColors: string[];
  defaultVizColor: string;
}
export interface InteractionConfig {
  dimmingOpacity: number;
}
export interface LegendStyle {
  verticalWidth: number;
  horizontalHeight: number;
}
export interface Theme {
  chart: ChartConfig;
  axes: AxisConfig;
  scales: ScalesConfig;
  colors: ColorConfig;
  interactions: InteractionConfig;
  legend: LegendStyle;
}
export interface LineSeriesStyle {
  hideLine: boolean;
  lineWidth: number;
  hideBorder: boolean;
  borderStrokeColor: string;
  borderWidth: number;
  hideDataPoints: boolean;
  dataPointsRadius: number;
  dataPointsStroke: string;
  dataPointsStrokeWidth: number;
}
export interface AreaSeriesStyle {
  hideArea: boolean;
  hideLine: boolean;
  lineStrokeColor: string;
  lineWidth: number;
  hideBorder: boolean;
  borderStrokeColor: string;
  borderWidth: number;
  hideDataPoints: boolean;
  dataPointsRadius: number;
  dataPointsStroke: string;
  dataPointsStrokeWidth: number;
}
export interface PartialTheme {
  chart?: Partial<ChartConfig>;
  axes?: Partial<AxisConfig>;
  scales?: Partial<ScalesConfig>;
  colors?: Partial<ColorConfig>;
  interactions?: Partial<InteractionConfig>;
  legend?: Partial<LegendStyle>;
}

export const DEFAULT_GRID_LINE_CONFIG: GridLineConfig = {
  stroke: 'red',
  strokeWidth: 1,
  opacity: 1,
};

export const DEFAULT_THEME: Theme = {
  chart: {
    paddings: {
      left: 5,
      right: 5,
      top: 5,
      bottom: 5,
    },
    margins: {
      left: 30,
      right: 30,
      top: 30,
      bottom: 30,
    },
    styles: {
      lineSeries: {
        hideLine: false,
        lineWidth: 1,
        hideBorder: true,
        borderWidth: 2,
        borderStrokeColor: 'gray',
        hideDataPoints: true,
        dataPointsRadius: 5,
        dataPointsStroke: 'white',
        dataPointsStrokeWidth: 1,
      },
      areaSeries: {
        hideArea: false,
        hideLine: true,
        lineWidth: 1,
        lineStrokeColor: 'white',
        hideBorder: true,
        borderWidth: 2,
        borderStrokeColor: 'gray',
        hideDataPoints: true,
        dataPointsRadius: 4,
        dataPointsStroke: 'white',
        dataPointsStrokeWidth: 1,
      },
    },
  },
  scales: {
    ordinal: {
      padding: 0.25,
    },
  },
  axes: {
    tickFontSize: 10,
    tickFontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
    tickFontStyle: 'normal',
    titleFontSize: 12,
    titleFontStyle: 'bold',
    titleFontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
    titlePadding: 5,
  },
  colors: {
    vizColors: [
      '#00B3A4',
      '#3185FC',
      '#DB1374',
      '#490092',
      '#FEB6DB',
      '#E6C220',
      '#F98510',
      '#BFA180',
      '#461A0A',
      '#920000',
    ],
    defaultVizColor: 'red',
  },
  interactions: {
    dimmingOpacity: 0.1,
  },
  legend: {
    verticalWidth: 150,
    horizontalHeight: 50,
  },
};

export function mergeWithDefaultTheme(theme: PartialTheme): Theme {
  const chart: ChartConfig = {
    ...DEFAULT_THEME.chart,
  };
  if (theme.chart) {
    chart.margins = {
      ...DEFAULT_THEME.chart.margins,
      ...theme.chart.margins,
    };
    chart.paddings = {
      ...DEFAULT_THEME.chart.paddings,
      ...theme.chart.paddings,
    };
    if (theme.chart.styles) {
      if (theme.chart.styles.areaSeries) {
        chart.styles.areaSeries = {
          ...DEFAULT_THEME.chart.styles.areaSeries,
          ...theme.chart.styles.areaSeries,
        };
      }
      if (theme.chart.styles.lineSeries) {
        chart.styles.lineSeries = {
          ...DEFAULT_THEME.chart.styles.lineSeries,
          ...theme.chart.styles.lineSeries,
        };
      }
    }
  }
  const scales: ScalesConfig = {
    ...DEFAULT_THEME.scales,
  };
  if (theme.scales) {
    scales.ordinal = {
      ...DEFAULT_THEME.scales.ordinal,
      ...theme.scales.ordinal,
    };
  }
  let axes: AxisConfig = {
    ...DEFAULT_THEME.axes,
  };
  if (theme.axes) {
    axes = {
      ...DEFAULT_THEME.axes,
      ...theme.axes,
    };
  }
  const colors: ColorConfig = {
    ...DEFAULT_THEME.colors,
  };
  if (theme.colors) {
    if (theme.colors.defaultVizColor) {
      colors.defaultVizColor = theme.colors.defaultVizColor;
    }
    if (theme.colors.vizColors) {
      colors.vizColors = theme.colors.vizColors;
    }
  }

  let interactions: InteractionConfig = {
    ...DEFAULT_THEME.interactions,
  };
  if (theme.interactions) {
    interactions = {
      ...DEFAULT_THEME.interactions,
      ...theme.interactions,
    };
  }

  let legend: LegendStyle = {
    ...DEFAULT_THEME.legend,
  };
  if (theme.legend) {
    legend = {
      ...DEFAULT_THEME.legend,
      ...theme.legend,
    };
  }
  return {
    chart,
    scales,
    axes,
    colors,
    interactions,
    legend,
  };
}
