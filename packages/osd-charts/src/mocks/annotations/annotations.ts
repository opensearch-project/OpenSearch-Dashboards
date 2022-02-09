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

import { getAnnotationLinePropsId } from '../../chart_types/xy_chart/annotations/line/dimensions';
import { AnnotationLineProps } from '../../chart_types/xy_chart/annotations/line/types';
import { AnnotationRectProps } from '../../chart_types/xy_chart/annotations/rect/types';
import { mergePartial, RecursivePartial } from '../../utils/common';

/** @internal */
export class MockAnnotationLineProps {
  private static readonly base: AnnotationLineProps = {
    id: getAnnotationLinePropsId('spec1', { dataValue: 0 }, 0),
    specId: 'spec1',
    linePathPoints: {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
    },
    panel: { top: 0, left: 0, width: 100, height: 100 },
    datum: { dataValue: 0 },
    markers: [],
  };

  static default(partial?: RecursivePartial<AnnotationLineProps>, smVerticalValue?: any, smHorizontalValue?: any) {
    const id = getAnnotationLinePropsId(
      partial?.specId ?? MockAnnotationLineProps.base.specId,
      {
        ...MockAnnotationLineProps.base.datum,
        ...partial?.datum,
      },
      0,
      smVerticalValue,
      smHorizontalValue,
    );
    return mergePartial<AnnotationLineProps>(
      MockAnnotationLineProps.base,
      { id, ...partial },
      {
        mergeOptionalPartialValues: true,
      },
    );
  }

  static fromPoints(x1 = 0, y1 = 0, x2 = 0, y2 = 0): AnnotationLineProps {
    return MockAnnotationLineProps.default({
      linePathPoints: {
        x1,
        y1,
        x2,
        y2,
      },
    });
  }

  static fromPartialAndId(partial?: RecursivePartial<AnnotationLineProps>) {
    return mergePartial<AnnotationLineProps>(MockAnnotationLineProps.base, partial, {
      mergeOptionalPartialValues: true,
    });
  }
}

/** @internal */
export class MockAnnotationRectProps {
  private static readonly base: AnnotationRectProps = {
    datum: { coordinates: { x0: 0, x1: 1, y0: 0, y1: 1 } },
    rect: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    panel: {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
    },
  };

  static default(partial?: RecursivePartial<AnnotationRectProps>) {
    return mergePartial<AnnotationRectProps>(MockAnnotationRectProps.base, partial, {
      mergeOptionalPartialValues: true,
    });
  }

  static fromValues(x = 0, y = 0, width = 0, height = 0): AnnotationRectProps {
    return MockAnnotationRectProps.default({
      rect: {
        x,
        y,
        width,
        height,
      },
    });
  }
}
