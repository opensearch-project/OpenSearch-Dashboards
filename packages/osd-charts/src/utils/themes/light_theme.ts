import { palettes } from './colors';
import { Theme } from './theme';
import {
  DEFAULT_CHART_MARGINS,
  DEFAULT_CHART_PADDING,
  DEFAULT_GEOMETRY_STYLES,
  DEFAULT_MISSING_COLOR,
} from './theme_commons';

export const LIGHT_THEME: Theme = {
  chartPaddings: DEFAULT_CHART_PADDING,
  chartMargins: DEFAULT_CHART_MARGINS,
  lineSeriesStyle: {
    line: {
      visible: true,
      strokeWidth: 1,
      opacity: 1,
    },
    point: {
      visible: true,
      strokeWidth: 1,
      fill: 'white',
      radius: 2,
      opacity: 1,
    },
  },
  areaSeriesStyle: {
    area: {
      visible: true,
      opacity: 0.3,
    },
    line: {
      visible: true,
      strokeWidth: 1,
      opacity: 1,
    },
    point: {
      visible: false,
      strokeWidth: 1,
      fill: 'white',
      radius: 2,
      opacity: 1,
    },
  },
  barSeriesStyle: {
    rect: {
      opacity: 1,
    },
    rectBorder: {
      visible: false,
      strokeWidth: 0,
    },
    displayValue: {
      fontSize: 8,
      fontStyle: 'normal',
      fontFamily: 'sans-serif',
      padding: 0,
      fill: '#777',
      offsetX: 0,
      offsetY: 0,
    },
  },
  sharedStyle: DEFAULT_GEOMETRY_STYLES,
  scales: {
    barsPadding: 0.25,
    histogramPadding: 0.05,
  },
  axes: {
    axisTitleStyle: {
      fontSize: 12,
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      padding: 8,
      fill: '#333',
    },
    axisLineStyle: {
      stroke: '#eaeaea',
      strokeWidth: 1,
    },
    tickLabelStyle: {
      fontSize: 10,
      fontFamily: 'sans-serif',
      fontStyle: 'normal',
      fill: '#777',
      padding: 4,
    },
    tickLineStyle: {
      visible: true,
      stroke: '#eaeaea',
      strokeWidth: 1,
    },
    gridLineStyle: {
      horizontal: {
        visible: true,
        stroke: '#D3DAE6',
        strokeWidth: 1,
        opacity: 1,
        dash: [0, 0],
      },
      vertical: {
        visible: true,
        stroke: '#D3DAE6',
        strokeWidth: 1,
        opacity: 1,
        dash: [0, 0],
      },
    },
  },
  colors: {
    vizColors: palettes.echPaletteColorBlind.colors,
    defaultVizColor: DEFAULT_MISSING_COLOR,
  },
  legend: {
    verticalWidth: 200,
    horizontalHeight: 64,
    spacingBuffer: 10,
  },
  crosshair: {
    band: {
      fill: '#F5F5F5',
      visible: true,
    },
    line: {
      stroke: '#777',
      strokeWidth: 1,
      dash: [5, 5],
      visible: true,
    },
  },
};
