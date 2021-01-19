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

import { mergePartial, RecursivePartial } from '../utils/common';
import { AreaGeometry, PointGeometry, BarGeometry, LineGeometry, BubbleGeometry } from '../utils/geometry';
import { LIGHT_THEME } from '../utils/themes/light_theme';
import { MockSeriesIdentifier } from './series/series_identifiers';

const color = 'red';
const { barSeriesStyle, lineSeriesStyle, areaSeriesStyle, bubbleSeriesStyle } = LIGHT_THEME;

export class MockPointGeometry {
  private static readonly base: PointGeometry = {
    x: 0,
    y: 0,
    radius: 0,
    color,
    seriesIdentifier: MockSeriesIdentifier.default(),
    styleOverrides: undefined,
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
    return mergePartial<PointGeometry>(MockPointGeometry.base, partial, { mergeOptionalPartialValues: true });
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

export class MockBarGeometry {
  private static readonly base: BarGeometry = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    color,
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

export class MockLineGeometry {
  private static readonly base: LineGeometry = {
    line: '',
    points: [],
    color,
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

export class MockAreaGeometry {
  private static readonly base: AreaGeometry = {
    area: '',
    lines: [],
    points: [],
    color,
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

export class MockBubbleGeometry {
  private static readonly base: BubbleGeometry = {
    points: [],
    color,
    seriesIdentifier: MockSeriesIdentifier.default(),
    seriesPointStyle: bubbleSeriesStyle.point,
  };

  static default(partial?: RecursivePartial<BubbleGeometry>) {
    return mergePartial<BubbleGeometry>(MockBubbleGeometry.base, partial, {
      mergeOptionalPartialValues: true,
    });
  }
}
