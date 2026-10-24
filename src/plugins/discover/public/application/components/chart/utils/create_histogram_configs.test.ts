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

import { createHistogramConfigs } from './create_histogram_configs';

const makeData = () => ({
  search: {
    aggs: { createAggConfigs: jest.fn().mockReturnValue({ aggs: [] }) },
    showError: jest.fn(),
  },
  query: { timefilter: { timefilter: { getTime: () => ({ from: 'now-15m', to: 'now' }) } } },
});

describe('createHistogramConfigs', () => {
  it('builds the agg when the time field exists', () => {
    const data = makeData();
    const indexPattern: any = {
      timeFieldName: '@timestamp',
      getTimeField: () => ({ name: '@timestamp', type: 'date' }),
    };

    const result = createHistogramConfigs(indexPattern, 'auto', data as any);

    expect(data.search.aggs.createAggConfigs).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('skips the agg and reports nothing when the named time field is absent', () => {
    const data = makeData();
    const indexPattern: any = {
      timeFieldName: '@timestamp',
      getTimeField: () => undefined,
    };

    const result = createHistogramConfigs(indexPattern, 'auto', data as any);

    expect(result).toBeUndefined();
    expect(data.search.aggs.createAggConfigs).not.toHaveBeenCalled();
    expect(data.search.showError).not.toHaveBeenCalled();
  });

  it('still surfaces a genuine agg failure', () => {
    const data = makeData();
    data.search.aggs.createAggConfigs = jest.fn(() => {
      throw new Error('something else broke');
    });
    const indexPattern: any = {
      timeFieldName: '@timestamp',
      getTimeField: () => ({ name: '@timestamp', type: 'date' }),
    };

    const result = createHistogramConfigs(indexPattern, 'auto', data as any);

    expect(result).toBeUndefined();
    expect(data.search.showError).toHaveBeenCalled();
  });
});
