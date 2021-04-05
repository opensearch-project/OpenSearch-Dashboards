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

import { SeriesKey } from '../../../../common/series_id';
import { XDomain } from '../../domains/types';
import { isDatumFilled } from '../../rendering/utils';
import { DataSeries, getSeriesKey, XYChartSeriesIdentifier } from '../../utils/series';
import { StackMode } from '../../utils/specs';
import { LastValues } from './types';

/**
 * @internal
 * @param dataSeries
 * @param xDomain
 */
export function getLastValues(dataSeries: DataSeries[], xDomain: XDomain): Map<SeriesKey, LastValues> {
  const lastValues = new Map<SeriesKey, LastValues>();

  // we need to get the latest
  dataSeries.forEach((series) => {
    if (series.data.length === 0) {
      return;
    }

    const last = series.data[series.data.length - 1];
    if (!last) {
      return;
    }
    if (isDatumFilled(last)) {
      return;
    }

    if (last.x !== xDomain.domain[xDomain.domain.length - 1]) {
      // we have a dataset that is not filled with all x values
      // and the last value of the series is not the last value for every series
      // let's skip it
      return;
    }

    const { y0, y1, initialY0, initialY1 } = last;
    const seriesKey = getSeriesKey(series as XYChartSeriesIdentifier, series.groupId);

    if (series.stackMode === StackMode.Percentage) {
      const y1InPercentage = y1 === null || y0 === null ? null : y1 - y0;
      lastValues.set(seriesKey, { y0, y1: y1InPercentage });
      return;
    }
    if (initialY0 !== null || initialY1 !== null) {
      lastValues.set(seriesKey, { y0: initialY0, y1: initialY1 });
    }
  });
  return lastValues;
}
