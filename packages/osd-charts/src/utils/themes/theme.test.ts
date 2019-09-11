import { Margins } from '../../utils/dimensions';
import { DARK_THEME } from './dark_theme';
import { LIGHT_THEME } from './light_theme';
import {
  AreaSeriesStyle,
  DEFAULT_ANNOTATION_LINE_STYLE,
  DEFAULT_ANNOTATION_RECT_STYLE,
  LineSeriesStyle,
  mergeWithDefaultAnnotationLine,
  mergeWithDefaultAnnotationRect,
  mergeGridLineConfigs,
  mergeWithDefaultTheme,
  PartialTheme,
  Theme,
} from './theme';

describe('Theme', () => {
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

  describe('mergeGridLineConfigs', () => {
    it('should merge partial grid line configs', () => {
      const fullConfig = {
        visible: true,
        stroke: 'foo',
        strokeWidth: 1,
        opacity: 0,
        dash: [0, 0],
      };
      const partialConfig = { strokeWidth: 5 };
      const themeConfig = LIGHT_THEME.axes.gridLineStyle.vertical;

      expect(mergeGridLineConfigs(fullConfig, themeConfig)).toEqual(fullConfig);
      expect(mergeGridLineConfigs({}, themeConfig)).toEqual(themeConfig);
      expect(mergeGridLineConfigs(partialConfig, themeConfig)).toEqual({ ...themeConfig, ...partialConfig });
    });
  });

  describe('mergeWithDefaultAnnotationLine', () => {
    it('should merge custom and default annotation line configs', () => {
      expect(mergeWithDefaultAnnotationLine()).toEqual(DEFAULT_ANNOTATION_LINE_STYLE);

      const customLineConfig = {
        stroke: 'foo',
        strokeWidth: 50,
        opacity: 1,
      };

      const defaultLineConfig = {
        stroke: '#777',
        strokeWidth: 1,
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
        fill: '#777',
        fontFamily: 'sans-serif',
        fontStyle: 'normal',
        padding: 0,
      };

      const expectedMergedCustomLineConfig = { line: customLineConfig, details: defaultDetailsConfig };
      const mergedCustomLineConfig = mergeWithDefaultAnnotationLine({ line: customLineConfig });
      expect(mergedCustomLineConfig).toEqual(expectedMergedCustomLineConfig);

      const expectedMergedCustomDetailsConfig = { line: defaultLineConfig, details: customDetailsConfig };
      const mergedCustomDetailsConfig = mergeWithDefaultAnnotationLine({ details: customDetailsConfig });
      expect(mergedCustomDetailsConfig).toEqual(expectedMergedCustomDetailsConfig);
    });
  });

  describe('mergeWithDefaultAnnotationRect', () => {
    it('should merge custom and default rect annotation style', () => {
      expect(mergeWithDefaultAnnotationRect()).toEqual(DEFAULT_ANNOTATION_RECT_STYLE);

      const customConfig = {
        stroke: 'customStroke',
        fill: 'customFill',
      };

      const expectedMergedConfig = {
        stroke: 'customStroke',
        fill: 'customFill',
        opacity: 0.25,
        strokeWidth: 0,
      };

      expect(mergeWithDefaultAnnotationRect(customConfig)).toEqual(expectedMergedConfig);
    });
  });

  describe('mergeWithDefaultTheme', () => {
    it('should default to LIGHT_THEME', () => {
      const partialTheme: PartialTheme = {};
      const mergedTheme = mergeWithDefaultTheme(partialTheme);
      expect(mergedTheme).toEqual(LIGHT_THEME);
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
          opacity: 1,
        },
        point: {
          fill: 'white',
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
          opacity: 1,
        },
        point: {
          fill: 'white',
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
      const partialTheme: PartialTheme = {
        barSeriesStyle: {
          rectBorder: {
            stroke: 'elastic_charts',
          },
          displayValue: {
            fontSize: 10,
            fontStyle: 'custom-font-style',
          },
        },
      };
      const mergedTheme = mergeWithDefaultTheme(partialTheme, DARK_THEME);
      expect(mergedTheme).toEqual({
        ...DARK_THEME,
        barSeriesStyle: {
          rect: {
            opacity: 1,
          },
          rectBorder: {
            ...DARK_THEME.barSeriesStyle.rectBorder,
            ...partialTheme!.barSeriesStyle!.rectBorder,
          },
          displayValue: {
            ...DARK_THEME.barSeriesStyle.displayValue,
            ...partialTheme!.barSeriesStyle!.displayValue,
          },
        },
      });
    });

    it('should merge partial theme: sharedStyle', () => {
      const partialTheme: PartialTheme = {
        sharedStyle: {
          highlighted: {
            opacity: 100,
          },
        },
      };
      const mergedTheme = mergeWithDefaultTheme(partialTheme, DARK_THEME);
      expect(mergedTheme).toEqual({
        ...DARK_THEME,
        sharedStyle: {
          ...DARK_THEME.sharedStyle,
          highlighted: {
            ...DARK_THEME.sharedStyle.highlighted,
            ...partialTheme!.sharedStyle!.highlighted,
          },
        },
      });
    });

    it('should merge partial theme: scales', () => {
      const partialTheme: PartialTheme = {
        scales: {
          barsPadding: 314571,
        },
      };
      const mergedTheme = mergeWithDefaultTheme(partialTheme, DARK_THEME);
      expect(mergedTheme).toEqual({
        ...DARK_THEME,
        scales: {
          ...DARK_THEME.scales,
          ...partialTheme!.scales,
        },
      });
    });

    it('should merge partial theme: axes', () => {
      const partialTheme: PartialTheme = {
        axes: {
          axisTitleStyle: {
            fontStyle: 'elastic_charts',
          },
          axisLineStyle: {
            stroke: 'elastic_charts',
          },
        },
      };
      const mergedTheme = mergeWithDefaultTheme(partialTheme, DARK_THEME);
      expect(mergedTheme).toEqual({
        ...DARK_THEME,
        axes: {
          ...DARK_THEME.axes,
          axisTitleStyle: {
            ...DARK_THEME.axes.axisTitleStyle,
            ...partialTheme!.axes!.axisTitleStyle,
          },
          axisLineStyle: {
            ...DARK_THEME.axes.axisLineStyle,
            ...partialTheme!.axes!.axisLineStyle,
          },
        },
      });
    });

    it('should merge partial theme: colors', () => {
      const partialTheme: PartialTheme = {
        colors: {
          vizColors: ['elastic_charts_c1', 'elastic_charts_c2'],
        },
      };
      const mergedTheme = mergeWithDefaultTheme(partialTheme, DARK_THEME);
      expect(mergedTheme).toEqual({
        ...DARK_THEME,
        colors: {
          ...DARK_THEME.colors,
          ...partialTheme!.colors,
        },
      });
    });

    it('should merge partial theme: legend', () => {
      const partialTheme: PartialTheme = {
        legend: {
          horizontalHeight: 314571,
        },
      };
      const mergedTheme = mergeWithDefaultTheme(partialTheme, DARK_THEME);
      expect(mergedTheme).toEqual({
        ...DARK_THEME,
        legend: {
          ...DARK_THEME.legend,
          ...partialTheme!.legend,
        },
      });
    });

    it('should merge partial theme: crosshair', () => {
      const partialTheme: PartialTheme = {
        crosshair: {
          band: {
            fill: 'elastic_charts_c1',
          },
          line: {
            strokeWidth: 314571,
          },
        },
      };
      const mergedTheme = mergeWithDefaultTheme(partialTheme, DARK_THEME);
      expect(mergedTheme).toEqual({
        ...DARK_THEME,
        crosshair: {
          ...DARK_THEME.crosshair,
          band: {
            ...DARK_THEME.crosshair.band,
            ...partialTheme!.crosshair!.band,
          },
          line: {
            ...DARK_THEME.crosshair.line,
            ...partialTheme!.crosshair!.line,
          },
        },
      });
    });

    it('should override all values if provided', () => {
      const mergedTheme = mergeWithDefaultTheme(LIGHT_THEME, DARK_THEME);
      expect(mergedTheme).toEqual(LIGHT_THEME);
    });

    it('should merge partial theme wtih axillaryThemes', () => {
      const customTheme = mergeWithDefaultTheme(
        {
          chartMargins: {
            bottom: 123,
          },
        },
        LIGHT_THEME,
        [
          {
            chartMargins: {
              top: 123,
            },
          },
          {
            chartMargins: {
              left: 123,
            },
          },
        ],
      );
      expect(customTheme.chartMargins).toBeDefined();
      expect(customTheme.chartMargins.bottom).toBe(123);
      expect(customTheme.chartMargins.top).toBe(123);
      expect(customTheme.chartMargins.left).toBe(123);
    });

    it('should merge theme with axillaryThemes in spatial order priority', () => {
      const customTheme = mergeWithDefaultTheme(
        {
          chartMargins: {
            bottom: 1,
          },
        },
        LIGHT_THEME,
        [
          {
            chartMargins: {
              top: 2,
              bottom: 2,
            },
          },
          {
            chartMargins: {
              top: 3,
              left: 3,
              bottom: 3,
            },
          },
        ],
      );
      expect(customTheme.chartMargins).toBeDefined();
      expect(customTheme.chartMargins.bottom).toBe(1);
      expect(customTheme.chartMargins.top).toBe(2);
      expect(customTheme.chartMargins.left).toBe(3);
    });
  });
});
