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
 * under the License.
 */

import { omit } from 'lodash';

import { buildPointGeometryStyles } from '../chart_types/xy_chart/rendering/point_style';
import { mergePartial, RecursivePartial } from '../utils/common';
import { AreaGeometry, PointGeometry, BarGeometry, LineGeometry, BubbleGeometry } from '../utils/geometry';
import { LIGHT_THEME } from '../utils/themes/light_theme';
import { PointShape } from '../utils/themes/theme';
import { MockSeriesIdentifier } from './series/series_identifiers';

const DEFAULT_MOCK_POINT_COLOR = 'red';
const { barSeriesStyle, lineSeriesStyle, areaSeriesStyle, bubbleSeriesStyle } = LIGHT_THEME;

/** @internal */
export class MockPointGeometry {
  private static readonly base: PointGeometry = {
    x: 0,
    y: 0,
    radius: lineSeriesStyle.point.radius,
    color: DEFAULT_MOCK_POINT_COLOR,
    seriesIdentifier: MockSeriesIdentifier.default(),
    style: {
      shape: PointShape.Circle,
      fill: {
        color: {
          r: 255,
          g: 255,
          b: 255,
          opacity: 1,
        },
      },
      stroke: {
        color: {
          r: 255,
          g: 0,
          b: 0,
          opacity: 1,
        },
        width: 1,
      },
    },
    value: {
      accessor: 'y0',
      x: 0,
      y: 0,
      mark: null,
      datum: { x: 0, y: 0 },
    },
    transform: {
      x: 0,
      y: 0,
    },
    panel: {
      width: 100,
      height: 100,
      left: 0,
      top: 0,
    },
    orphan: false,
  };

  static default(partial?: RecursivePartial<PointGeometry>) {
    const color = partial?.color ?? DEFAULT_MOCK_POINT_COLOR;
    const style = buildPointGeometryStyles(color, lineSeriesStyle.point);
    return mergePartial<PointGeometry>(MockPointGeometry.base, partial, { mergeOptionalPartialValues: true }, [
      { style },
    ]);
  }

  static fromBaseline(baseline: RecursivePartial<PointGeometry>, omitKeys: string[] | string = []) {
    return (partial?: RecursivePartial<PointGeometry>) => {
      return omit(
        mergePartial<PointGeometry>(MockPointGeometry.base, partial, { mergeOptionalPartialValues: true }, [baseline]),
        omitKeys,
      );
    };
  }
}

/** @internal */
export class MockBarGeometry {
  private static readonly base: BarGeometry = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color: DEFAULT_MOCK_POINT_COLOR,
    displayValue: undefined,
    seriesIdentifier: MockSeriesIdentifier.default(),
    value: {
      accessor: 'y0',
      x: 0,
      y: 0,
      mark: null,
      datum: { x: 0, y: 0 },
    },
    seriesStyle: barSeriesStyle,
    transform: {
      x: 0,
      y: 0,
    },
    panel: {
      width: 100,
      height: 100,
      left: 0,
      top: 0,
    },
  };

  static default(partial?: RecursivePartial<BarGeometry>) {
    return mergePartial<BarGeometry>(MockBarGeometry.base, partial, { mergeOptionalPartialValues: true });
  }

  static fromBaseline(baseline: RecursivePartial<BarGeometry>, omitKeys: string[] | string = []) {
    return (partial?: RecursivePartial<BarGeometry>) => {
      const geo = mergePartial<BarGeometry>(MockBarGeometry.base, partial, { mergeOptionalPartialValues: true }, [
        baseline,
      ]);
      return omit(geo, omitKeys);
    };
  }
}

/** @internal */
export class MockLineGeometry {
  private static readonly base: LineGeometry = {
    line: '',
    points: [],
    color: DEFAULT_MOCK_POINT_COLOR,
    transform: {
      x: 0,
      y: 0,
    },
    seriesIdentifier: MockSeriesIdentifier.default(),
    seriesLineStyle: lineSeriesStyle.line,
    seriesPointStyle: lineSeriesStyle.point,
    clippedRanges: [],
  };

  static default(partial?: RecursivePartial<LineGeometry>) {
    return mergePartial<LineGeometry>(MockLineGeometry.base, partial, { mergeOptionalPartialValues: true });
  }
}

/** @internal */
export class MockAreaGeometry {
  private static readonly base: AreaGeometry = {
    area: '',
    lines: [],
    points: [],
    color: DEFAULT_MOCK_POINT_COLOR,
    transform: {
      x: 0,
      y: 0,
    },
    seriesIdentifier: MockSeriesIdentifier.default(),
    seriesAreaStyle: areaSeriesStyle.area,
    seriesAreaLineStyle: areaSeriesStyle.line,
    seriesPointStyle: areaSeriesStyle.point,
    isStacked: false,
    clippedRanges: [],
  };

  static default(partial?: RecursivePartial<AreaGeometry>) {
    return mergePartial<AreaGeometry>(MockAreaGeometry.base, partial, { mergeOptionalPartialValues: true });
  }
}

/** @internal */
export class MockBubbleGeometry {
  private static readonly base: BubbleGeometry = {
    points: [],
    color: DEFAULT_MOCK_POINT_COLOR,
    seriesIdentifier: MockSeriesIdentifier.default(),
    seriesPointStyle: bubbleSeriesStyle.point,
  };

  static default(partial?: RecursivePartial<BubbleGeometry>) {
    return mergePartial<BubbleGeometry>(MockBubbleGeometry.base, partial, {
      mergeOptionalPartialValues: true,
    });
  }
}
