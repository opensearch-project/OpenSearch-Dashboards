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

export function filterQuery(allowedVals: string[], requestedVals: string[]): string[] {
  const filteredVals = allowedVals.filter((val) => !requestedVals || requestedVals.includes(val));
  return filteredVals;
}
