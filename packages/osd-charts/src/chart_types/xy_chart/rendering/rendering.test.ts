import { DEFAULT_GEOMETRY_STYLES } from '../../../utils/themes/theme_commons';
import { getSpecId } from '../../../utils/ids';
import {
  BarGeometry,
  getGeometryStyle,
  isPointOnGeometry,
  PointGeometry,
  getStyleOverrides,
  GeometryId,
} from './rendering';
import { BarSeriesStyle } from '../../../utils/themes/theme';
import { DataSeriesDatum } from '../utils/series';
import { RecursivePartial, mergePartial } from '../../../utils/commons';

describe('Rendering utils', () => {
  test('check if point is in geometry', () => {
    const seriesStyle = {
      rect: {
        opacity: 1,
      },
      rectBorder: {
        strokeWidth: 1,
        visible: false,
      },
      displayValue: {
        fill: 'black',
        fontFamily: '',
        fontSize: 2,
        offsetX: 0,
        offsetY: 0,
        padding: 2,
      },
    };

    const geometry: BarGeometry = {
      color: 'red',
      geometryId: {
        seriesKey: [],
        specId: getSpecId('id'),
      },
      value: {
        accessor: 'y1',
        x: 0,
        y: 0,
      },
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      seriesStyle,
    };
    expect(isPointOnGeometry(0, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(0, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(-10, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(-11, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(11, 11, geometry)).toBe(false);
  });
  test('check if point is in point geometry', () => {
    const geometry: PointGeometry = {
      color: 'red',
      geometryId: {
        seriesKey: [],
        specId: getSpecId('id'),
      },
      value: {
        accessor: 'y1',
        x: 0,
        y: 0,
      },
      transform: {
        x: 0,
        y: 0,
      },
      x: 0,
      y: 0,
      radius: 10,
    };
    expect(isPointOnGeometry(0, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(0, 10, geometry)).toBe(true);
    expect(isPointOnGeometry(10, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(11, 11, geometry)).toBe(false);
    expect(isPointOnGeometry(-10, 0, geometry)).toBe(true);
    expect(isPointOnGeometry(-11, 0, geometry)).toBe(false);
    expect(isPointOnGeometry(11, 11, geometry)).toBe(false);
  });

  test('should get common geometry style dependent on legend item highlight state', () => {
    const geometryId = {
      seriesKey: [],
      specId: getSpecId('id'),
    };
    const highlightedLegendItem = {
      key: '',
      color: '',
      label: '',
      value: {
        colorValues: [],
        specId: getSpecId('id'),
      },
      isSeriesVisible: true,
      isLegendItemVisible: true,
      displayValue: {
        raw: '',
        formatted: '',
      },
    };

    const unhighlightedLegendItem = {
      ...highlightedLegendItem,
      value: {
        colorValues: [],
        specId: getSpecId('foo'),
      },
    };

    const sharedThemeStyle = DEFAULT_GEOMETRY_STYLES;
    const specOpacity = 0.66;

    const defaultStyle = getGeometryStyle(geometryId, null, sharedThemeStyle);

    // no highlighted elements
    expect(defaultStyle).toEqual({ opacity: 1 });

    const customDefaultStyle = getGeometryStyle(geometryId, null, sharedThemeStyle, specOpacity);

    // no highlighted elements with custom spec opacity
    expect(customDefaultStyle).toEqual({ opacity: 0.66 });

    const highlightedStyle = getGeometryStyle(geometryId, highlightedLegendItem, sharedThemeStyle);

    // should equal highlighted opacity
    expect(highlightedStyle).toEqual({ opacity: 1 });

    const unhighlightedStyle = getGeometryStyle(geometryId, unhighlightedLegendItem, sharedThemeStyle);

    // should equal unhighlighted opacity
    expect(unhighlightedStyle).toEqual({ opacity: 0.25 });

    const customHighlightedStyle = getGeometryStyle(geometryId, highlightedLegendItem, sharedThemeStyle, specOpacity);

    // should equal custom spec highlighted opacity
    expect(customHighlightedStyle).toEqual({ opacity: 0.66 });

    const customUnhighlightedStyle = getGeometryStyle(
      geometryId,
      unhighlightedLegendItem,
      sharedThemeStyle,
      specOpacity,
    );

    // unhighlighted elements remain unchanged with custom opacity
    expect(customUnhighlightedStyle).toEqual({ opacity: 0.25 });

    // has individual highlight
    const hasIndividualHighlight = getGeometryStyle(geometryId, null, sharedThemeStyle, undefined, {
      hasHighlight: true,
      hasGeometryHover: true,
    });

    expect(hasIndividualHighlight).toEqual({ opacity: 1 });

    // no highlight
    const noHighlight = getGeometryStyle(geometryId, null, sharedThemeStyle, undefined, {
      hasHighlight: false,
      hasGeometryHover: true,
    });

    expect(noHighlight).toEqual({ opacity: 0.25 });

    // no geometry hover
    const noHover = getGeometryStyle(geometryId, null, sharedThemeStyle, undefined, {
      hasHighlight: true,
      hasGeometryHover: false,
    });

    expect(noHover).toEqual({ opacity: 1 });
  });

  describe('getStyleOverrides', () => {
    let mockAccessor: jest.Mock;

    const sampleSeriesStyle: BarSeriesStyle = {
      rect: {
        opacity: 1,
      },
      rectBorder: {
        visible: true,
        strokeWidth: 1,
      },
      displayValue: {
        fontSize: 10,
        fontFamily: 'helvetica',
        fill: 'blue',
        padding: 1,
        offsetX: 1,
        offsetY: 1,
      },
    };
    const datum: DataSeriesDatum = {
      x: 1,
      y1: 2,
      y0: 3,
      initialY1: 4,
      initialY0: 5,
    };
    const geometryId: GeometryId = {
      specId: getSpecId('test'),
      seriesKey: ['test'],
    };

    beforeEach(() => {
      mockAccessor = jest.fn();
    });

    it('should return input seriesStyle if no styleAccessor is passed', () => {
      const styleOverrides = getStyleOverrides(datum, geometryId, sampleSeriesStyle);

      expect(styleOverrides).toBe(sampleSeriesStyle);
    });

    it('should return input seriesStyle if styleAccessor returns null', () => {
      mockAccessor.mockReturnValue(null);
      const styleOverrides = getStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).toBe(sampleSeriesStyle);
    });

    it('should call styleAccessor with datum and geometryId', () => {
      getStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

      expect(mockAccessor).toBeCalledWith(datum, geometryId);
    });

    it('should return seriesStyle with updated fill color', () => {
      const color = 'blue';
      mockAccessor.mockReturnValue(color);
      const styleOverrides = getStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);
      const expectedStyles: BarSeriesStyle = {
        ...sampleSeriesStyle,
        rect: {
          ...sampleSeriesStyle.rect,
          fill: color,
        },
      };
      expect(styleOverrides).toEqual(expectedStyles);
    });

    it('should return a new seriesStyle object with color', () => {
      mockAccessor.mockReturnValue('blue');
      const styleOverrides = getStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).not.toBe(sampleSeriesStyle);
    });

    it('should return seriesStyle with updated partial style', () => {
      const partialStyle: RecursivePartial<BarSeriesStyle> = {
        rect: {
          fill: 'blue',
        },
        rectBorder: {
          strokeWidth: 10,
        },
      };
      mockAccessor.mockReturnValue(partialStyle);
      const styleOverrides = getStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);
      const expectedStyles = mergePartial(sampleSeriesStyle, partialStyle, {
        mergeOptionalPartialValues: true,
      });

      expect(styleOverrides).toEqual(expectedStyles);
    });

    it('should return a new seriesStyle object with partial styles', () => {
      mockAccessor.mockReturnValue({
        rect: {
          fill: 'blue',
        },
      });
      const styleOverrides = getStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).not.toBe(sampleSeriesStyle);
    });
  });
});
