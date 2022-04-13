/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export function pointSeriesTooltipFormatter() {
  return function tooltipFormatter({ datum, data }) {
    if (!datum) return '';

    const details = [];

    const currentSeries =
      data.series && data.series.find((series) => series.rawId === datum.seriesId);
    const addDetail = (label, value) => details.push({ label, value });

    if (datum.extraMetrics) {
      datum.extraMetrics.forEach((metric) => {
        addDetail(metric.label, metric.value);
      });
    }

    if (datum.x !== null && datum.x !== undefined) {
      addDetail(data.xAxisLabel, data.xAxisFormatter(datum.x));
    }

    if (datum.y !== null && datum.y !== undefined) {
      const value = datum.yScale ? datum.yScale * datum.y : datum.y;
      let label = currentSeries.label;

      // For stacked charts the y axis data is only available in the raw table
      const tableColumns = datum?.yRaw?.table?.columns;
      if (tableColumns && tableColumns.length > 2) {
        const yColumn = datum.yRaw.column ? tableColumns[datum.yRaw.column] : {};
        label = yColumn.name || label;
      }
      addDetail(label, currentSeries.yAxisFormatter(value));
    }

    if (datum.z !== null && datum.z !== undefined) {
      addDetail(currentSeries.zLabel, currentSeries.zAxisFormatter(datum.z));
    }
    if (datum.series && datum.parent) {
      const dimension = datum.parent;
      addDetail(dimension.title, datum.series);
    }
    if (datum.tableRaw) {
      addDetail(datum.tableRaw.title, datum.tableRaw.value);
    }

    return renderToStaticMarkup(
      <table>
        <tbody>
          {details.map((detail, index) => (
            <tr key={index}>
              <td className="visTooltip__label">
                <div className="visTooltip__labelContainer">{detail.label}</div>
              </td>

              <td className="visTooltip__value">
                <div className="visTooltip__valueContainer">
                  {detail.value}
                  {detail.percent && <span> ({detail.percent})</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
}
