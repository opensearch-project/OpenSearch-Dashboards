/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { datasetRequiresExplicitRun } from './requires_explicit_run';

const queryStringWith = (getType: (type: string) => any) =>
  ({ getDatasetService: () => ({ getType }) }) as any;

describe('datasetRequiresExplicitRun', () => {
  it('is true only when the dataset type opts in', () => {
    const queryString = queryStringWith((type) =>
      type === 'EXPLICIT' ? { meta: { requiresExplicitRun: true } } : { meta: {} }
    );
    expect(datasetRequiresExplicitRun(queryString, { type: 'EXPLICIT' })).toBe(true);
    expect(datasetRequiresExplicitRun(queryString, { type: 'OTHER' })).toBe(false);
  });

  it('is false without a dataset, an unknown type, or when the lookup throws', () => {
    expect(
      datasetRequiresExplicitRun(
        queryStringWith(() => undefined),
        { type: 'X' }
      )
    ).toBe(false);
    expect(
      datasetRequiresExplicitRun(
        queryStringWith(() => ({ meta: {} })),
        undefined
      )
    ).toBe(false);
    expect(
      datasetRequiresExplicitRun(
        queryStringWith(() => {
          throw new Error('boom');
        }),
        { type: 'X' }
      )
    ).toBe(false);
    expect(datasetRequiresExplicitRun(undefined, { type: 'X' })).toBe(false);
  });
});
