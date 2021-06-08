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

import createCachedSelector from 're-reselect';

import { ScaleContinuous } from '../../../../scales';
import { ScaleType } from '../../../../scales/constants';
import { getChartIdSelector } from '../../../../state/selectors/get_chart_id';
import { CanvasTextBBoxCalculator } from '../../../../utils/bbox/canvas_text_bbox_calculator';
import { getHeatmapConfigSelector } from './get_heatmap_config';
import { getHeatmapTableSelector } from './get_heatmap_table';

/**
 * @internal
 * Gets color scale based on specification and values range.
 */
export const getXAxisRightOverflow = createCachedSelector(
  [getHeatmapConfigSelector, getHeatmapTableSelector],
  ({ xAxisLabel: { fontSize, fontFamily, padding, formatter, width }, timeZone }, { xDomain }): number => {
    if (xDomain.type !== ScaleType.Time) {
      return 0;
    }
    if (typeof width === 'number') {
      return width / 2;
    }

    const timeScale = new ScaleContinuous(
      {
        type: ScaleType.Time,
        domain: xDomain.domain,
        range: [0, 1],
      },
      {
        timeZone,
      },
    );
    const bboxCompute = new CanvasTextBBoxCalculator();
    const maxTextWidth = timeScale.ticks().reduce((acc, d) => {
      const text = formatter(d);
      const textSize = bboxCompute.compute(text, padding, fontSize, fontFamily, 1);
      return Math.max(acc, textSize.width + padding);
    }, 0);
    bboxCompute.destroy();
    return maxTextWidth / 2;
  },
)(getChartIdSelector);
