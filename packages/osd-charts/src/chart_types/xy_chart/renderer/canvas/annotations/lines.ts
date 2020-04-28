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
 * under the License. */

import { Stroke, Line } from '../../../../../geoms/types';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { AnnotationLineProps } from '../../../annotations/line/types';
import { LineAnnotationStyle } from '../../../../../utils/themes/theme';
import { renderMultiLine } from '../primitives/line';

/** @internal */
export function renderLineAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: AnnotationLineProps[],
  lineStyle: LineAnnotationStyle,
) {
  const lines = annotations.map<Line>((annotation) => {
    const {
      start: { x1, y1 },
      end: { x2, y2 },
    } = annotation.linePathPoints;
    return {
      x1,
      y1,
      x2,
      y2,
    };
  });
  const strokeColor = stringToRGB(lineStyle.line.stroke);
  strokeColor.opacity = strokeColor.opacity * lineStyle.line.opacity;
  const stroke: Stroke = {
    color: strokeColor,
    width: lineStyle.line.strokeWidth,
  };

  renderMultiLine(ctx, lines, stroke);
}
