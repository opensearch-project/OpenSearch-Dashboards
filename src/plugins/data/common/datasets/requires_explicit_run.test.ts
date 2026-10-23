/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { datasetTypeRequiresExplicitRun } from './requires_explicit_run';

describe('datasetTypeRequiresExplicitRun', () => {
  it('is true only when the type sets meta.requiresExplicitRun to true', () => {
    expect(datasetTypeRequiresExplicitRun({ meta: { requiresExplicitRun: true } })).toBe(true);
    expect(datasetTypeRequiresExplicitRun({ meta: { requiresExplicitRun: false } })).toBe(false);
    expect(datasetTypeRequiresExplicitRun({ meta: {} })).toBe(false);
    expect(datasetTypeRequiresExplicitRun({})).toBe(false);
    expect(datasetTypeRequiresExplicitRun(undefined)).toBe(false);
  });
});
