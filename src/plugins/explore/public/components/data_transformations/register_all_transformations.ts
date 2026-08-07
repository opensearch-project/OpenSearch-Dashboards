/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransformationService } from './transformation_service';
import { limitTransformationDefinition } from './transformations/limit_transformation';
import { sortByTransformationDefinition } from './transformations/sortby_transformation';
import { filterTransformationDefinition } from './transformations/filter_transformation';
import { addFieldTransformationDefinition } from './transformations/add_field_transformation';
import { filterFieldsTransformationDefinition } from './transformations/filter_fields_transformation';
import { convertFieldTypeTransformationDefinition } from './transformations/convert_field_type_transformation';
import { groupByTransformationDefinition } from './transformations/group_by_transformation';
import { extractFieldsTransformationDefinition } from './transformations/extract_fields_transformation';

export function registerAllTransformations(service: TransformationService): void {
  service.registerDefinition(limitTransformationDefinition);
  service.registerDefinition(sortByTransformationDefinition);
  service.registerDefinition(filterTransformationDefinition);
  service.registerDefinition(addFieldTransformationDefinition);
  service.registerDefinition(filterFieldsTransformationDefinition);
  service.registerDefinition(convertFieldTypeTransformationDefinition);
  service.registerDefinition(groupByTransformationDefinition);
  service.registerDefinition(extractFieldsTransformationDefinition);
}
