import { Margins } from '../utils/dimensions';
import { DARK_THEME } from './dark_theme';
import { LIGHT_THEME } from './light_theme';
import {
  AreaSeriesStyle,
  AxisConfig,
  BarSeriesStyle,
  ColorConfig,
  CrosshairStyle,
  DEFAULT_ANNOTATION_LINE_STYLE,
  DEFAULT_ANNOTATION_RECT_STYLE,
  DEFAULT_GRID_LINE_CONFIG,
  LegendStyle,
  LineSeriesStyle,
  mergeWithDefaultAnnotationLine,
  mergeWithDefaultAnnotationRect,
  mergeWithDefaultGridLineConfig,
  mergeWithDefaultTheme,
  ScalesConfig,
  SharedGeometryStyle,
  Theme,
} from './theme';

describe('Themes', () => {
  let CLONED_LIGHT_THEME: Theme;
  let CLONED_DARK_THEME: Theme;

  beforeEach(() => {
    CLONED_LIGHT_THEME = JSON.parse(JSON.stringify(LIGHT_THEME));
    CLONED_DARK_THEME = JSON.parse(JSON.stringify(DARK_THEME));
  });

  afterEach(() => {
    // check default immutability
    expect(LIGHT_THEME).toEqual(CLONED_LIGHT_THEME);
    expect(DARK_THEME).toEqual(CLONED_DARK_THEME);
  });

  it('should merge partial theme: margins', () => {
    const customTheme = mergeWithDefaultTheme({
      chartMargins: {
        bottom: 314571,
        top: 314571,
        left: 314571,
        right: 314571,
      },
    });
    expect(customTheme.chartMargins).toBeDefined();
    expect(customTheme.chartMargins.bottom).toBe(314571);
    expect(customTheme.chartMargins.left).toBe(314571);
    expect(customTheme.chartMargins.right).toBe(314571);
    expect(customTheme.chartMargins.top).toBe(314571);
  });

  it('should merge partial theme: paddings', () => {
    const chartPaddings: Margins = {
      bottom: 314571,
      top: 314571,
      left: 314571,
      right: 314571,
    };
    const customTheme = mergeWithDefaultTheme({
      chartPaddings,
    });
    expect(customTheme.chartPaddings).toBeDefined();
    expect(customTheme.chartPaddings.bottom).toBe(314571);
    expect(customTheme.chartPaddings.left).toBe(314571);
    expect(customTheme.chartPaddings.right).toBe(314571);
    expect(customTheme.chartPaddings.top).toBe(314571);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        chartPaddings,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.chartPaddings).toEqual(chartPaddings);
  });

  it('should merge partial theme: lineSeriesStyle', () => {
    const lineSeriesStyle: LineSeriesStyle = {
      line: {
        stroke: 'elastic_charts',
        strokeWidth: 314571,
        visible: true,
      },
      border: {
        stroke: 'elastic_charts',
        strokeWidth: 314571,
        visible: true,
      },
      point: {
        radius: 314571,
        stroke: 'elastic_charts',
        strokeWidth: 314571,
        visible: true,
        opacity: 314571,
      },
    };
    const customTheme = mergeWithDefaultTheme({
      lineSeriesStyle,
    });
    expect(customTheme.lineSeriesStyle).toEqual(lineSeriesStyle);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        lineSeriesStyle,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.lineSeriesStyle).toEqual(lineSeriesStyle);
  });

  it('should merge partial theme: areaSeriesStyle', () => {
    const areaSeriesStyle: AreaSeriesStyle = {
      area: {
        fill: 'elastic_charts',
        visible: true,
        opacity: 314571,
      },
      line: {
        stroke: 'elastic_charts',
        strokeWidth: 314571,
        visible: true,
      },
      border: {
        stroke: 'elastic_charts',
        strokeWidth: 314571,
        visible: true,
      },
      point: {
        visible: true,
        radius: 314571,
        stroke: 'elastic_charts',
        strokeWidth: 314571,
        opacity: 314571,
      },
    };
    const customTheme = mergeWithDefaultTheme({
      areaSeriesStyle,
    });
    expect(customTheme.areaSeriesStyle).toEqual(areaSeriesStyle);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        areaSeriesStyle,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.areaSeriesStyle).toEqual(areaSeriesStyle);
  });

  it('should merge partial theme: barSeriesStyle', () => {
    const barSeriesStyle: BarSeriesStyle = {
      border: {
        stroke: 'elastic_charts',
        strokeWidth: 314571,
        visible: true,
      },
      displayValue: {
        fontSize: 10,
        fontStyle: 'custom-font-style',
        fontFamily: 'custom-font',
        padding: 5,
        fill: 'custom-fill',
      },
    };
    const customTheme = mergeWithDefaultTheme({
      barSeriesStyle,
    });
    expect(customTheme.barSeriesStyle).toEqual(barSeriesStyle);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        barSeriesStyle,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.barSeriesStyle).toEqual(barSeriesStyle);
  });

  it('should merge partial theme: sharedStyle', () => {
    const sharedStyle: SharedGeometryStyle = {
      default: {
        opacity: 314571,
      },
      highlighted: {
        opacity: 314571,
      },
      unhighlighted: {
        opacity: 314571,
      },
    };
    const customTheme = mergeWithDefaultTheme({
      sharedStyle,
    });
    expect(customTheme.sharedStyle).toEqual(sharedStyle);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        sharedStyle,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.sharedStyle).toEqual(sharedStyle);
  });

  it('should merge partial theme: scales', () => {
    const scales: ScalesConfig = {
      barsPadding: 314571,
    };
    const customTheme = mergeWithDefaultTheme({
      scales,
    });
    expect(customTheme.scales).toEqual(scales);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        scales,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.scales).toEqual(scales);
  });

  it('should merge partial theme: axes', () => {
    const axes: AxisConfig = {
      axisTitleStyle: {
        fontSize: 314571,
        fontStyle: 'elastic_charts',
        fontFamily: 'elastic_charts',
        padding: 314571,
        fill: 'elastic_charts',
      },
      axisLineStyle: {
        stroke: 'elastic_charts',
        strokeWidth: 314571,
      },
      tickLabelStyle: {
        fontSize: 314571,
        fontFamily: 'elastic_charts',
        fontStyle: 'elastic_charts',
        fill: 'elastic_charts',
        padding: 314571,
      },
      tickLineStyle: {
        stroke: 'elastic_charts',
        strokeWidth: 314571,
      },
    };
    const customTheme = mergeWithDefaultTheme({
      axes,
    });
    expect(customTheme.axes).toEqual(axes);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        axes,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.axes).toEqual(axes);
  });

  it('should merge partial theme: colors', () => {
    const colors: ColorConfig = {
      vizColors: ['elastic_charts_c1', 'elastic_charts_c2'],
      defaultVizColor: 'elastic_charts',
    };
    const customTheme = mergeWithDefaultTheme({
      colors,
    });
    expect(customTheme.colors).toEqual(colors);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        colors,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.colors).toEqual(colors);

    const vizColors: Partial<ColorConfig> = {
      vizColors: ['elastic_charts_c1', 'elastic_charts_c2'],
    };
    const partialUpdatedCustomTheme = mergeWithDefaultTheme({
      colors: vizColors,
    });
    expect(partialUpdatedCustomTheme.colors.vizColors).toEqual(vizColors.vizColors);

    const defaultVizColor: Partial<ColorConfig> = {
      defaultVizColor: 'elastic_charts',
    };
    const partialUpdated2CustomTheme = mergeWithDefaultTheme({
      colors: defaultVizColor,
    });
    expect(partialUpdated2CustomTheme.colors.defaultVizColor).toEqual(
      defaultVizColor.defaultVizColor,
    );
  });

  it('should merge partial theme: legends', () => {
    const legend: LegendStyle = {
      verticalWidth: 314571,
      horizontalHeight: 314571,
    };
    const customTheme = mergeWithDefaultTheme({
      legend,
    });
    expect(customTheme.legend).toEqual(legend);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        legend,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.legend).toEqual(legend);
  });
  it('should merge partial theme: crosshair', () => {
    const crosshair: CrosshairStyle = {
      band: {
        visible: false,
        fill: 'elastic_charts_c1',
      },
      line: {
        visible: false,
        stroke: 'elastic_charts_c1',
        strokeWidth: 314571,
      },
    };
    const customTheme = mergeWithDefaultTheme({
      crosshair,
    });
    expect(customTheme.crosshair).toEqual(crosshair);
    const customDarkTheme = mergeWithDefaultTheme(
      {
        crosshair,
      },
      DARK_THEME,
    );
    expect(customDarkTheme.crosshair).toEqual(crosshair);
  });

  it('should merge partial grid line configs', () => {
    const fullConfig = {
      stroke: 'foo',
      strokeWidth: 1,
      opacity: 0,
      dash: [0, 0],
    };
    expect(mergeWithDefaultGridLineConfig(fullConfig)).toEqual(fullConfig);
    expect(mergeWithDefaultGridLineConfig({})).toEqual(DEFAULT_GRID_LINE_CONFIG);
  });

  it('should merge custom and default annotation line configs', () => {
    expect(mergeWithDefaultAnnotationLine()).toEqual(DEFAULT_ANNOTATION_LINE_STYLE);

    const customLineConfig = {
      stroke: 'foo',
      strokeWidth: 50,
      opacity: 1,
    };

    const defaultLineConfig = {
      stroke: '#000',
      strokeWidth: 3,
      opacity: 1,
    };

    const customDetailsConfig = {
      fontSize: 50,
      fontFamily: 'custom-font-family',
      fontStyle: 'custom-font-style',
      fill: 'custom-fill',
      padding: 20,
    };

    const defaultDetailsConfig = {
      fontSize: 10,
      fontFamily: `'Open Sans', Helvetica, Arial, sans-serif`,
      fontStyle: 'normal',
      fill: 'gray',
      padding: 0,
    };

    const expectedMergedCustomLineConfig = { line: customLineConfig, details: defaultDetailsConfig };
    const mergedCustomLineConfig = mergeWithDefaultAnnotationLine({ line: customLineConfig });
    expect(mergedCustomLineConfig).toEqual(expectedMergedCustomLineConfig);

    const expectedMergedCustomDetailsConfig = { line: defaultLineConfig, details: customDetailsConfig };
    const mergedCustomDetailsConfig = mergeWithDefaultAnnotationLine({ details: customDetailsConfig });
    expect(mergedCustomDetailsConfig).toEqual(expectedMergedCustomDetailsConfig);
  });
  it('should merge custom and default rect annotation style', () => {
    expect(mergeWithDefaultAnnotationRect()).toEqual(DEFAULT_ANNOTATION_RECT_STYLE);

    const customConfig = {
      stroke: 'customStroke',
      fill: 'customFill',
    };

    const expectedMergedConfig = {
      stroke: 'customStroke',
      fill: 'customFill',
      opacity: 0.5,
      strokeWidth: 1,
    };

    expect(mergeWithDefaultAnnotationRect(customConfig)).toEqual(expectedMergedConfig);
  });
});
