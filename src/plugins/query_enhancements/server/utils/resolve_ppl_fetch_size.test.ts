/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/server';
import {
  AGGREGATION_SAMPLE_SIZE_SETTING,
  resolvePPLFetchSize,
  SAMPLE_SIZE_SETTING,
} from './resolve_ppl_fetch_size';

describe('resolvePPLFetchSize', () => {
  // jest.fn erases the generic on IUiSettingsClient.get, so the stub is cast at the boundary; the
  // intersection keeps `.get` inspectable for the call assertions below.
  const uiSettings = () =>
    ({
      get: jest.fn(async (key: string) => (key === SAMPLE_SIZE_SETTING ? 500 : 10000)),
    }) as unknown as Pick<IUiSettingsClient, 'get'> & { get: jest.Mock };

  it('uses discover:sampleSize for a document search', async () => {
    const settings = uiSettings();
    await expect(resolvePPLFetchSize(settings, 'source=logs | where a = 1')).resolves.toBe(500);
    expect(settings.get).toHaveBeenCalledWith(SAMPLE_SIZE_SETTING);
  });

  it.each([
    'source=logs | stats count() by service',
    'source=logs | stats count() by span(@timestamp, 1h)',
    'source=logs | top 5 service',
    'source=logs | rare level',
  ])('uses discover:aggregationSampleSize for %s', async (query) => {
    const settings = uiSettings();
    await expect(resolvePPLFetchSize(settings, query)).resolves.toBe(10000);
    expect(settings.get).toHaveBeenCalledWith(AGGREGATION_SAMPLE_SIZE_SETTING);
  });

  it.each(['source=logs | head', 'source=logs | head 20', 'source=logs | head 20 from 40'])(
    'returns undefined without reading settings when the query ends with head: %s',
    async (query) => {
      const settings = uiSettings();
      await expect(resolvePPLFetchSize(settings, query)).resolves.toBeUndefined();
      expect(settings.get).not.toHaveBeenCalled();
    }
  );

  it('limits a query whose head is followed by other commands', async () => {
    await expect(
      resolvePPLFetchSize(uiSettings(), 'source=logs | head 20 | fields a')
    ).resolves.toBe(500);
  });

  it('limits a query whose head is only inside a subquery', async () => {
    await expect(
      resolvePPLFetchSize(uiSettings(), 'source=logs | where id in [ source=other | head 5 ]')
    ).resolves.toBe(500);
  });

  it('ignores the word stats inside a string literal', async () => {
    const settings = uiSettings();
    await resolvePPLFetchSize(settings, "source=logs | where msg = 'stats count() by x'");
    expect(settings.get).toHaveBeenCalledWith(SAMPLE_SIZE_SETTING);
  });

  it('uses discover:sampleSize for an empty query', async () => {
    await expect(resolvePPLFetchSize(uiSettings(), '')).resolves.toBe(500);
  });
});
