/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AggConfig,
  AggsStart,
  BucketAggType,
  IndexPatternField,
  propFilter,
} from '../../../../../../data/common';
import { Schema } from '../../../../../../vis_default_editor/public';
import { AggProps } from '../config_panel';

export interface CreateNewAggConfig {
  fieldName: string;
  sourceGroup: string;
  destinationSchema: Schema;
  aggProps: AggProps;
  aggService: AggsStart;
  sourceAgg: AggConfig | null | undefined;
}

const filterByName = propFilter('name');
const filterByType = propFilter('type');

const getIndexPatternField = (indexFieldName: string, availableFields: IndexPatternField[]) =>
  availableFields.find(({ name }) => name === indexFieldName);

export const getValidAggTypes = ({
  fieldName,
  sourceGroup,
  destinationSchema,
  aggProps,
  aggService,
  sourceAgg,
}: CreateNewAggConfig) => {
  const isCountField =
    sourceGroup === 'preDefinedCountMetric' ||
    (sourceAgg && Object.keys(sourceAgg.params).length === 0);

  const indexField = isCountField
    ? { type: 'count' }
    : getIndexPatternField(fieldName, aggProps.indexPattern?.fields ?? []);

  if (!indexField) return [];

  // Get all aggTypes allowed by the schema and get a list of all the aggTypes that the dragged index field can use
  const aggTypes = aggService.types.getAll();
  // `types` can be either a Bucket or Metric aggType, but both types have the name property.
  const allowedAggTypes = filterByName(
    aggTypes[destinationSchema.group] as BucketAggType[],
    destinationSchema.aggFilter
  );

  return (
    allowedAggTypes
      .filter((aggType) => {
        const allowedFieldTypes = aggType.paramByName('field')?.filterFieldTypes;
        return filterByType([indexField], allowedFieldTypes).length !== 0;
      })
      .filter((aggType) => (isCountField ? true : aggType.name !== 'count'))
      // `types` can be either a Bucket or Metric aggType, but both types have the name property.
      .map((aggType) => (aggType as BucketAggType).name)
  );
};

export const createNewAggConfig = ({
  fieldName,
  sourceGroup,
  destinationSchema,
  aggProps,
  aggService,
  sourceAgg,
}: CreateNewAggConfig) => {
  const schemaAggTypes = (destinationSchema.defaults as any).aggTypes;

  const destinationValidAggType = getValidAggTypes({
    fieldName,
    sourceGroup,
    destinationSchema,
    aggProps,
    aggService,
    sourceAgg,
  });

  const allowedAggTypes = schemaAggTypes
    ? schemaAggTypes.filter((type: string) => destinationValidAggType.includes(type))
    : [];

  aggProps.aggConfigs?.createAggConfig({
    type: allowedAggTypes[0] || destinationValidAggType[0],
    schema: destinationSchema.name,
    params: {
      field: fieldName,
    },
  });
};
