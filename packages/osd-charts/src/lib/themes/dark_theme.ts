import { palettes } from './colors';
import { Theme } from './theme';

import {
  DEFAULT_CHART_MARGINS,
  DEFAULT_CHART_PADDING,
  DEFAULT_GEOMETRY_STYLES,
  DEFAULT_MISSING_COLOR,
} from './theme_commons';

export const DARK_THEME: Theme = {
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
      strokeWidth: 0,
      radius: 1,
      opacity: 1,
    },
  },
  areaSeriesStyle: {
    area: {
      visible: true,
      opacity: 1,
    },
    line: {
      visible: true,
      strokeWidth: 1,
      opacity: 1,
    },
    point: {
      visible: true,
      strokeWidth: 0,
      radius: 1,
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
      fontSize: 10,
      fontStyle: 'normal',
      fontFamily: 'sans-serif',
      padding: 0,
      fill: 'white',
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
      padding: 5,
      fill: 'white',
    },
    axisLineStyle: {
      stroke: 'white',
      strokeWidth: 1,
    },
    tickLabelStyle: {
      fontSize: 10,
      fontFamily: 'sans-serif',
      fontStyle: 'normal',
      fill: 'white',
      padding: 1,
    },
    tickLineStyle: {
      stroke: 'white',
      strokeWidth: 1,
    },
  },
  colors: {
    vizColors: palettes.echPaletteColorBlind.colors,
    defaultVizColor: DEFAULT_MISSING_COLOR,
  },
  legend: {
    verticalWidth: 200,
    horizontalHeight: 64,
  },
  crosshair: {
    band: {
      fill: 'lightgray',
      visible: true,
    },
    line: {
      stroke: 'gray',
      strokeWidth: 1,
      dash: [5, 5],
      visible: true,
    },
  },
};
