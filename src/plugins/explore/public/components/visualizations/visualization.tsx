/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { VisualizationBuilder } from './visualization_builder';
import { ChartStyleControlMap, ChartType } from './utils/use_visualization_types';
import { getExpressions } from '../../services/services';
import { AxisRole } from './types';
import { ChartConfig } from './visualization_builder.types';

interface Props<T extends ChartType> extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<Record<string, any>>;
  type: T;
  fields?: Array<{ name: string; role: AxisRole }>;
  options?: ChartStyleControlMap[T];
}

export const Visualization = <T extends ChartType>({
  data,
  type,
  fields,
  options,
  ...divProps
}: Props<T>) => {
  const visualizationBuilderRef = useRef(
    new VisualizationBuilder({
      getExpressions: () => getExpressions(),
    })
  );

  useEffect(() => {
    const visualizationBuilder = visualizationBuilderRef.current;
    visualizationBuilder.init();
    return () => {
      visualizationBuilder.reset();
    };
  }, []);

  useEffect(() => {
    const visualizationBuilder = visualizationBuilderRef.current;
    const config: ChartConfig = { type };

    if (fields) {
      const mapping: Record<string, string> = {};
      for (const f of fields) {
        mapping[f.role] = f.name;
      }
      config.axesMapping = mapping;
    }

    if (options) {
      config.styles = options;
    }

    visualizationBuilder.setVisConfig(config);
    visualizationBuilder.handleData(data);
  }, [data, type, fields, options]);

  return <div {...divProps}>{visualizationBuilderRef.current.renderVisualization()}</div>;
};
