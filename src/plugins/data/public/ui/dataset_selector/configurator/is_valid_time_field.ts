/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetField } from '../../../../common';

/**
 * Whether a dataset field can be used as a time field for a Date Histogram aggregation.
 *
 * This mirrors the availability rules enforced by `FieldParamType` in the aggs framework
 * (see src/plugins/data/common/search/aggs/param_types/field.ts): a field must be a date,
 * aggregatable, and not live inside a nested object. Filtering the time-field picker with the
 * same rules prevents offering fields such as the nested `events.time` on otel trace indices,
 * which would otherwise be selectable but fail later with
 * "Saved field ... is invalid for use with the Date Histogram aggregation".
 */
export const isValidTimeField = (field: DatasetField): boolean =>
  field.type === 'date' && field.aggregatable !== false && !field.subType?.nested;
