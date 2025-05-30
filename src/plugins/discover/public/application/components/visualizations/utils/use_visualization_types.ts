/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IExpressionLoaderParams } from '../../../../../../expressions/public';
import { LineChartStyleControls } from '../line/line_vis_config';
import { DiscoverViewServices } from '../../../../build_services';
import { IFieldType, IndexPattern } from '../../../../opensearch_dashboards_services';
import { OpenSearchSearchHit } from '../../../doc_views/doc_views_types';
import { LineVisStyleControlsProps } from '../line/line_vis_options';
import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES } from '../../../../../../data/common';
import { DiscoverVisColumn } from '../types';
import { visualizationRegistry } from '../visualization_registry';

export interface VisualizationType {
  readonly name: string;
  readonly type: string;
  readonly ui: {
    style: {
      defaults: LineChartStyleControls;
      render: ({
        styleOptions,
        onStyleChange,
        numericalColumns,
        categoricalColumns,
        dateColumns,
      }: LineVisStyleControlsProps) => JSX.Element;
    };
  };
  readonly toExpression: (
    services: DiscoverViewServices,
    searchContext: IExpressionLoaderParams['searchContext'],
    indexPattern: IndexPattern,
    transformedData?: Array<Record<string, any>>,
    numericalColumns?: DiscoverVisColumn[],
    categoricalColumns?: DiscoverVisColumn[],
    dateColumns?: DiscoverVisColumn[],
    styleOptions?: Partial<LineChartStyleControls>
  ) => Promise<string | undefined>;
}

export type DiscoverVisFieldType = 'numerical' | 'categorical' | 'date' | 'unknown';

// Map both OSD_FIELD_TYPES and OPENSEARCH_FIELD_TYPES to DiscoverVisFieldType
// We also need to handle the case where a new field is created with a opensearch type
const FIELD_TYPE_MAP: Partial<Record<string, DiscoverVisFieldType>> = {
  // Map OSD_FIELD_TYPES to DiscoverVisFieldType
  [OSD_FIELD_TYPES.BOOLEAN]: 'categorical',
  [OSD_FIELD_TYPES.DATE]: 'date',
  [OSD_FIELD_TYPES.NUMBER]: 'numerical',
  [OSD_FIELD_TYPES.STRING]: 'categorical',
  [OSD_FIELD_TYPES.OBJECT]: 'unknown',
  [OSD_FIELD_TYPES.NESTED]: 'unknown',
  [OSD_FIELD_TYPES.HISTOGRAM]: 'numerical',

  // Map the rest of OPENSEARCH_FIELD_TYPES to DiscoverVisFieldType
  [OPENSEARCH_FIELD_TYPES.DATE_NANOS]: 'date',
  [OPENSEARCH_FIELD_TYPES.FLOAT]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.HALF_FLOAT]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.SCALED_FLOAT]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.DOUBLE]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.INTEGER]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.LONG]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.SHORT]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.UNSIGNED_LONG]: 'numerical',
  [OPENSEARCH_FIELD_TYPES.TEXT]: 'categorical',
  [OPENSEARCH_FIELD_TYPES.KEYWORD]: 'categorical',
  [OPENSEARCH_FIELD_TYPES.WILDCARD]: 'categorical',
};

export interface VisualizationTypeResult {
  visualizationType?: VisualizationType;
  numericalColumns?: DiscoverVisColumn[];
  categoricalColumns?: DiscoverVisColumn[];
  dateColumns?: DiscoverVisColumn[];
  transformedData?: Array<Record<string, any>>;
}

const getFieldTypeFromSchema = (schema?: string): DiscoverVisFieldType =>
  FIELD_TYPE_MAP[schema || ''] || 'unknown';

// Implement this function to return the visualization type based on the query based on the returned data
export const getVisualizationType = (
  rows?: OpenSearchSearchHit[],
  fieldSchema?: Array<Partial<IFieldType>>
): VisualizationTypeResult | undefined => {
  if (!fieldSchema || !rows) {
    return;
  }
  const columns: DiscoverVisColumn[] = fieldSchema.map((field, index) => {
    return {
      id: index,
      schema: getFieldTypeFromSchema(field.type),
      name: field.name || '',
      column: `field-${index}`,
    };
  });
  const transformedData = rows.map((row: OpenSearchSearchHit) => {
    const transformedRow: Record<string, any> = {};
    for (const column of columns) {
      transformedRow[column.column] = row._source[column.name];
    }
    return transformedRow;
  });

  return {
    ...visualizationRegistry.getVisualizationType(columns),
    transformedData,
  };
};
