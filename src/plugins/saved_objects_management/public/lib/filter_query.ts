/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function filterQuery(allowedVals: string[], requestedVals?: string[]): string[] {
  const filteredVals = requestedVals
    ? allowedVals.filter((val) => requestedVals.includes(val))
    : allowedVals;
  return filteredVals;
}
