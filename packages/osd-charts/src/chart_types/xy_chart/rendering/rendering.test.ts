import {
  getGeometryStateStyle,
  isPointOnGeometry,
  getBarStyleOverrides,
  getPointStyleOverrides,
  getClippedRanges,
} from './rendering';
import { BarSeriesStyle, SharedGeometryStateStyle, PointStyle } from '../../../utils/themes/theme';
import { DataSeriesDatum } from '../utils/series';
import { mergePartial, RecursivePartial } from '../../../utils/commons';
import { BarGeometry, PointGeometry, GeometryId } from '../../../utils/geometry';
import { MockDataSeries } from '../../../mocks';
import { MockScale } from '../../../mocks/scale';

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
        specId: 'id',
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
        specId: 'id',
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
      specId: 'id',
    };
    const highlightedLegendItem = {
      key: '',
      color: '',
      label: '',
      value: {
        colorValues: [],
        specId: 'id',
      },
      isSeriesVisible: true,
      isLegendItemVisible: true,
      displayValue: {
        formatted: {
          y0: null,
          y1: null,
        },
        raw: {
          y0: null,
          y1: null,
        },
      },
    };

    const unhighlightedLegendItem = {
      ...highlightedLegendItem,
      value: {
        colorValues: [],
        specId: 'foo',
      },
    };

    const sharedThemeStyle: SharedGeometryStateStyle = {
      default: {
        opacity: 1,
      },
      highlighted: {
        opacity: 0.5,
      },
      unhighlighted: {
        opacity: 0.25,
      },
    };

    // no highlighted elements
    const defaultStyle = getGeometryStateStyle(geometryId, null, sharedThemeStyle);
    expect(defaultStyle).toBe(sharedThemeStyle.default);

    // should equal highlighted opacity
    const highlightedStyle = getGeometryStateStyle(geometryId, highlightedLegendItem, sharedThemeStyle);
    expect(highlightedStyle).toBe(sharedThemeStyle.highlighted);

    // should equal unhighlighted opacity
    const unhighlightedStyle = getGeometryStateStyle(geometryId, unhighlightedLegendItem, sharedThemeStyle);
    expect(unhighlightedStyle).toBe(sharedThemeStyle.unhighlighted);

    // should equal custom spec highlighted opacity
    const customHighlightedStyle = getGeometryStateStyle(geometryId, highlightedLegendItem, sharedThemeStyle);
    expect(customHighlightedStyle).toBe(sharedThemeStyle.highlighted);

    // unhighlighted elements remain unchanged with custom opacity
    const customUnhighlightedStyle = getGeometryStateStyle(geometryId, unhighlightedLegendItem, sharedThemeStyle);
    expect(customUnhighlightedStyle).toBe(sharedThemeStyle.unhighlighted);

    // has individual highlight
    const hasIndividualHighlight = getGeometryStateStyle(geometryId, null, sharedThemeStyle, {
      hasHighlight: true,
      hasGeometryHover: true,
    });
    expect(hasIndividualHighlight).toBe(sharedThemeStyle.highlighted);

    // no highlight
    const noHighlight = getGeometryStateStyle(geometryId, null, sharedThemeStyle, {
      hasHighlight: false,
      hasGeometryHover: true,
    });
    expect(noHighlight).toBe(sharedThemeStyle.unhighlighted);

    // no geometry hover
    const noHover = getGeometryStateStyle(geometryId, null, sharedThemeStyle, {
      hasHighlight: true,
      hasGeometryHover: false,
    });
    expect(noHover).toBe(sharedThemeStyle.highlighted);
  });

  describe('getBarStyleOverrides', () => {
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
      specId: 'test',
      seriesKey: ['test'],
    };

    beforeEach(() => {
      mockAccessor = jest.fn();
    });

    it('should return input seriesStyle if no barStyleAccessor is passed', () => {
      const styleOverrides = getBarStyleOverrides(datum, geometryId, sampleSeriesStyle);

      expect(styleOverrides).toBe(sampleSeriesStyle);
    });

    it('should return input seriesStyle if barStyleAccessor returns null', () => {
      mockAccessor.mockReturnValue(null);
      const styleOverrides = getBarStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).toBe(sampleSeriesStyle);
    });

    it('should call barStyleAccessor with datum and geometryId', () => {
      getBarStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

      expect(mockAccessor).toBeCalledWith(datum, geometryId);
    });

    it('should return seriesStyle with updated fill color', () => {
      const color = 'blue';
      mockAccessor.mockReturnValue(color);
      const styleOverrides = getBarStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);
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
      const styleOverrides = getBarStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

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
      const styleOverrides = getBarStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);
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
      const styleOverrides = getBarStyleOverrides(datum, geometryId, sampleSeriesStyle, mockAccessor);

      expect(styleOverrides).not.toBe(sampleSeriesStyle);
    });
  });

  describe('getPointStyleOverrides', () => {
    let mockAccessor: jest.Mock;

    const datum: DataSeriesDatum = {
      x: 1,
      y1: 2,
      y0: 3,
      initialY1: 4,
      initialY0: 5,
    };
    const geometryId: GeometryId = {
      specId: 'test',
      seriesKey: ['test'],
    };

    beforeEach(() => {
      mockAccessor = jest.fn();
    });

    it('should return undefined if no pointStyleAccessor is passed', () => {
      const styleOverrides = getPointStyleOverrides(datum, geometryId);

      expect(styleOverrides).toBeUndefined();
    });

    it('should return undefined if pointStyleAccessor returns null', () => {
      mockAccessor.mockReturnValue(null);
      const styleOverrides = getPointStyleOverrides(datum, geometryId, mockAccessor);

      expect(styleOverrides).toBeUndefined();
    });

    it('should call pointStyleAccessor with datum and geometryId', () => {
      getPointStyleOverrides(datum, geometryId, mockAccessor);

      expect(mockAccessor).toBeCalledWith(datum, geometryId);
    });

    it('should return seriesStyle with updated stroke color', () => {
      const stroke = 'blue';
      mockAccessor.mockReturnValue(stroke);
      const styleOverrides = getPointStyleOverrides(datum, geometryId, mockAccessor);
      const expectedStyles: Partial<PointStyle> = {
        stroke,
      };
      expect(styleOverrides).toEqual(expectedStyles);
    });
  });

  describe('getClippedRanges', () => {
    const dataSeries = MockDataSeries.fitFunction({ shuffle: false });
    const xScale = MockScale.default({
      scale: jest.fn().mockImplementation((x) => x),
      bandwidth: 0,
      range: [dataSeries.data[0].x as number, dataSeries.data[12].x as number],
    });

    it('should return array pairs of non-null x regions with null end values', () => {
      const actual = getClippedRanges(dataSeries.data, xScale, 0);

      expect(actual).toEqual([[0, 1], [2, 4], [4, 6], [7, 11], [11, 12]]);
    });

    it('should return array pairs of non-null x regions with valid end values', () => {
      const data = dataSeries.data.slice(1, -1);
      const xScale = MockScale.default({
        scale: jest.fn().mockImplementation((x) => x),
        range: [data[0].x as number, data[10].x as number],
      });
      const actual = getClippedRanges(data, xScale, 0);

      expect(actual).toEqual([[2, 4], [4, 6], [7, 11]]);
    });

    it('should account for bandwidth', () => {
      const bandwidth = 2;
      const xScale = MockScale.default({
        scale: jest.fn().mockImplementation((x) => x),
        bandwidth,
        range: [dataSeries.data[0].x as number, (dataSeries.data[12].x as number) + bandwidth * (2 / 3)],
      });
      const actual = getClippedRanges(dataSeries.data, xScale, 0);

      expect(actual).toEqual([[0, 2], [3, 5], [5, 7], [8, 12]]);
    });

    it('should account for xScaleOffset', () => {
      const actual = getClippedRanges(dataSeries.data, xScale, 2);

      expect(actual).toEqual([[0, -1], [0, 2], [2, 4], [5, 9]]);
    });

    it('should call scale to get x value for each datum', () => {
      getClippedRanges(dataSeries.data, xScale, 0);

      expect(xScale.scale).toHaveBeenNthCalledWith(1, dataSeries.data[0].x);
      expect(xScale.scale).toHaveBeenCalledTimes(dataSeries.data.length);
      expect(xScale.scale).toHaveBeenCalledWith(dataSeries.data[12].x);
    });
  });
});
