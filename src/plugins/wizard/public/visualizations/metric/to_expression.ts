/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SchemaConfig } from '../../../../visualizations/public';
import { MetricVisExpressionFunctionDefinition } from '../../../../vis_type_metric/public';
import { AggConfigs, IAggConfig } from '../../../../data/common';
import { buildExpression, buildExpressionFunction } from '../../../../expressions/public';
import { RootState } from '../../application/utils/state_management';
import { MetricOptionsDefaults } from './metric_viz_type';
import { getAggExpressionFunctions } from '../common/expression_helpers';

const prepareDimension = (params: SchemaConfig) => {
  const visdimension = buildExpressionFunction('visdimension', { accessor: params.accessor });

  if (params.format) {
    visdimension.addArgument('format', params.format.id);
    visdimension.addArgument('formatParams', JSON.stringify(params.format.params));
  }

  return buildExpression([visdimension]);
};

// TODO: Update to the common getShemas from src/plugins/visualizations/public/legacy/build_pipeline.ts
//  And move to a common location accessible by all the visualizations
const getVisSchemas = (aggConfigs: AggConfigs): any => {
  const createSchemaConfig = (accessor: number, agg: IAggConfig): SchemaConfig => {
    const hasSubAgg = [
      'derivative',
      'moving_avg',
      'serial_diff',
      'cumulative_sum',
      'sum_bucket',
      'avg_bucket',
      'min_bucket',
      'max_bucket',
    ].includes(agg.type.name);

    const formatAgg = hasSubAgg
      ? agg.params.customMetric || agg.aggConfigs.getRequestAggById(agg.params.metricAgg)
      : agg;

    const params = {};

    const label = agg.makeLabel && agg.makeLabel();

    return {
      accessor,
      format: formatAgg.toSerializedFieldFormat(),
      params,
      label,
      aggType: agg.type.name,
    };
  };

  let cnt = 0;
  const schemas: any = {
    metric: [],
  };

  if (!aggConfigs) {
    return schemas;
  }

  const responseAggs = aggConfigs.getResponseAggs();
  responseAggs.forEach((agg) => {
    const schemaName = agg.schema;

    if (!schemaName) {
      cnt++;
      return;
    }

    if (!schemas[schemaName]) {
      schemas[schemaName] = [];
    }

    schemas[schemaName]!.push(createSchemaConfig(cnt++, agg));
  });

  return schemas;
};

export interface MetricRootState extends RootState {
  style: MetricOptionsDefaults;
}

export const toExpression = async ({ style: styleState, visualization }: MetricRootState) => {
  const { aggConfigs, expressionFns } = await getAggExpressionFunctions(visualization);

  // TODO: Update to use the getVisSchemas function from the Visualizations plugin
  // const schemas = getVisSchemas(vis, params);

  const {
    percentageMode,
    useRanges,
    colorSchema,
    metricColorMode,
    colorsRange,
    labels,
    invertColors,
    style,
  } = styleState.metric;

  const schemas = getVisSchemas(aggConfigs);

  // fix formatter for percentage mode
  if (percentageMode === true) {
    schemas.metric.forEach((metric: SchemaConfig) => {
      metric.format = { id: 'percent' };
    });
  }

  // TODO: ExpressionFunctionDefinitions mark all arguments as required even though the function marks most as optional
  // Update buildExpressionFunction to correctly handle optional arguments
  // @ts-expect-error
  const metricVis = buildExpressionFunction<MetricVisExpressionFunctionDefinition>('metricVis', {
    percentageMode,
    colorSchema,
    colorMode: metricColorMode,
    useRanges,
    invertColors,
    showLabels: labels && labels.show,
  });

  if (style) {
    metricVis.addArgument('bgFill', style.bgFill);
    metricVis.addArgument('font', buildExpression(`font size=${style.fontSize}`));
    metricVis.addArgument('subText', style.subText);
  }

  if (colorsRange) {
    colorsRange.forEach((range: any) => {
      metricVis.addArgument(
        'colorRange',
        buildExpression(`range from=${range.from} to=${range.to}`)
      );
    });
  }

  if (schemas.group) {
    metricVis.addArgument('bucket', prepareDimension(schemas.group[0]));
  }

  schemas.metric.forEach((metric: SchemaConfig) => {
    metricVis.addArgument('metric', prepareDimension(metric));
  });

  return buildExpression([...expressionFns, metricVis]).toString();
};
