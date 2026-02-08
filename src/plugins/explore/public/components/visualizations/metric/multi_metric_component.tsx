/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import { MetricChartStyle } from './metric_vis_config';
import { createSingleMetric } from './to_expression';
import { AxisColumnMappings, VisColumn } from '../types';

interface SingleMetricProps {
  data: Array<Record<string, any>>;
  categoryName: string;
  styles: MetricChartStyle;
  metricField: string;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  axisColumnMappings?: AxisColumnMappings;
}

interface MultiMetricComponentProps {
  facetedData: any[][];
  categoryNames: string[];
  styles: MetricChartStyle;
  metricField: string;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  axisColumnMappings?: AxisColumnMappings;
}

// Single Metric component that renders one ECharts instance
const SingleMetricComponent: React.FC<SingleMetricProps> = ({
  data,
  categoryName,
  styles,
  metricField,
  numericalColumns,
  categoricalColumns,
  dateColumns,
  axisColumnMappings,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Create ECharts instance
    const chartInstance = echarts.init(chartRef.current);
    chartInstanceRef.current = chartInstance;

    // Create spec for single metric
    const spec = createSingleMetric(
      data,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styles,
      axisColumnMappings
    );

    chartInstance.setOption(spec);

    // Cleanup
    return () => {
      chartInstance.dispose();
    };
  }, [
    data,
    styles,
    metricField,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    axisColumnMappings,
  ]);

  return (
    <div className="multi-metric-item">
      <div className="multi-metric-title">{categoryName}</div>
      <div ref={chartRef} style={{ width: '100%', height: '120px' }} />
    </div>
  );
};

// Main Multi-Metric component with flexbox layout
export const MultiMetricComponent: React.FC<MultiMetricComponentProps> = ({
  facetedData,
  categoryNames,
  styles,
  metricField,
  numericalColumns,
  categoricalColumns,
  dateColumns,
  axisColumnMappings,
}) => {
  return (
    <div className="multi-metric-container">
      {facetedData.map((dataset, index) => {
        // Convert faceted data back to record format for single metric
        const header = dataset[0];
        const rows = dataset.slice(1);
        const data = rows.map((row) => {
          const record: Record<string, any> = {};
          header.forEach((colName: string, colIndex: number) => {
            record[colName] = row[colIndex];
          });
          return record;
        });

        return (
          <SingleMetricComponent
            key={index}
            data={data}
            // categoryName={categoryNames[index] || `Category ${index + 1}`}
            categoryName={categoryNames[index]}
            styles={styles}
            metricField={metricField}
            numericalColumns={numericalColumns}
            categoricalColumns={categoricalColumns}
            dateColumns={dateColumns}
            axisColumnMappings={axisColumnMappings}
          />
        );
      })}
    </div>
  );
};
