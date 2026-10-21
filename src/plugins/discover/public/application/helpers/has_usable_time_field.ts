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

import { IndexPattern } from '../../../../data/public';

/**
 * Whether time-based features can actually run against this pattern.
 *
 * IndexPattern.isTimeBased() only checks that timeFieldName is set, so it
 * stays true for a pattern naming a field its index does not have. Callers
 * that build time aggregations or show a time range need the field to resolve.
 */
export function hasUsableTimeField(indexPattern?: IndexPattern): boolean {
  return !!indexPattern?.getTimeField();
}
