/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { datasetRequiresExplicitRun, getDatasetTypeConfig } from './requires_explicit_run';

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

describe('getDatasetTypeConfig', () => {
  it('returns the registered config', () => {
    const config = { id: 'X', meta: {} };
    expect(
      getDatasetTypeConfig(
        queryStringWith(() => config),
        'X'
      )
    ).toBe(config);
  });

  it('is undefined without a type, a dataset service, or when the lookup throws', () => {
    expect(
      getDatasetTypeConfig(
        queryStringWith(() => ({})),
        undefined
      )
    ).toBeUndefined();
    expect(getDatasetTypeConfig({} as any, 'X')).toBeUndefined();
    expect(
      getDatasetTypeConfig(
        queryStringWith(() => {
          throw new Error('boom');
        }),
        'X'
      )
    ).toBeUndefined();
    expect(getDatasetTypeConfig(undefined, 'X')).toBeUndefined();
  });
});
