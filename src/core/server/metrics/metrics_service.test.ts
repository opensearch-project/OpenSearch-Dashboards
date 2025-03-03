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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import moment from 'moment';
import { firstValueFrom } from '@osd/std';
import { take } from 'rxjs/operators';
import { setInterval, clearInterval } from 'timers';
import { configServiceMock } from '../config/mocks';
import { mockOpsCollector } from './metrics_service.test.mocks';
import { MetricsService } from './metrics_service';
import { mockCoreContext } from '../core_context.mock';
import { httpServiceMock } from '../http/http_service.mock';

const testInterval = 100;

const dummyMetrics = { metricA: 'value', metricB: 'otherValue' };

// Mock global setInterval/clearInterval functions
jest.mock('timers', () => ({
  setInterval: jest.fn((fn, ms) => {
    return { id: 'interval-id', fn, ms };
  }),
  clearInterval: jest.fn(),
}));

// Import the mocked setInterval/clearInterval

describe('MetricsService', () => {
  const httpMock = httpServiceMock.createInternalSetupContract();
  let metricsService: MetricsService;

  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });

    // Clear mock state before each test
    mockOpsCollector.collect.mockClear();
    mockOpsCollector.reset.mockClear();
    setInterval.mockClear();
    clearInterval.mockClear();

    const configService = configServiceMock.create({
      atPath: { interval: moment.duration(testInterval) },
    });
    const coreContext = mockCoreContext.create({ configService });
    metricsService = new MetricsService(coreContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('#start', () => {
    it('invokes setInterval with the configured interval', async () => {
      await metricsService.setup({ http: httpMock });
      await metricsService.start();

      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), testInterval);
    });

    it('collects the metrics at every interval', async () => {
      mockOpsCollector.collect.mockResolvedValue(dummyMetrics);

      await metricsService.setup({ http: httpMock });
      await metricsService.start();

      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(1);

      // Manually trigger the interval callback
      const intervalCallback = setInterval.mock.calls[0][0];
      await intervalCallback();
      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(2);

      await intervalCallback();
      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(3);
    });

    it('resets the collector after each collection', async () => {
      mockOpsCollector.collect.mockResolvedValue(dummyMetrics);

      await metricsService.setup({ http: httpMock });
      const { getOpsMetrics$ } = await metricsService.start();

      // Initial call from start()
      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(1);
      expect(mockOpsCollector.reset).toHaveBeenCalledTimes(1);

      // Manually trigger the interval callback
      const intervalCallback = setInterval.mock.calls[0][0];

      // Wait for complete emission cycle
      await intervalCallback();
      await firstValueFrom(getOpsMetrics$().pipe(take(1)));

      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(2);
      expect(mockOpsCollector.reset).toHaveBeenCalledTimes(2);

      // Wait for another complete emission cycle
      await intervalCallback();
      await firstValueFrom(getOpsMetrics$().pipe(take(1)));

      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(3);
      expect(mockOpsCollector.reset).toHaveBeenCalledTimes(3);
    });

    it('throws when called before setup', async () => {
      await expect(metricsService.start()).rejects.toThrowErrorMatchingInlineSnapshot(
        `"#setup() needs to be run first"`
      );
    });

    it('emits the last value on each getOpsMetrics$ call', async () => {
      const firstMetrics = { metric: 'first' };
      const secondMetrics = { metric: 'second' };
      mockOpsCollector.collect
        .mockResolvedValueOnce(firstMetrics)
        .mockResolvedValueOnce(secondMetrics);

      await metricsService.setup({ http: httpMock });
      const { getOpsMetrics$ } = await metricsService.start();

      // Initial value from start()
      let emission = await firstValueFrom(getOpsMetrics$().pipe(take(1)));
      expect(emission).toEqual({ metric: 'first' });

      // Manually trigger the interval callback for second value
      const intervalCallback = setInterval.mock.calls[0][0];
      await intervalCallback();

      emission = await firstValueFrom(getOpsMetrics$().pipe(take(1)));
      expect(emission).toEqual({ metric: 'second' });
    });
  });

  describe('#stop', () => {
    it('stops the metrics interval', async () => {
      mockOpsCollector.collect.mockResolvedValue(dummyMetrics);

      await metricsService.setup({ http: httpMock });
      const { getOpsMetrics$ } = await metricsService.start();

      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(1);

      // Manually trigger interval callback
      const intervalCallback = setInterval.mock.calls[0][0];
      await intervalCallback();

      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(2);

      // Stop should call clearInterval
      await metricsService.stop();
      expect(clearInterval).toHaveBeenCalledTimes(1);

      // After stop, further calls to the callback shouldn't affect collect call count
      await intervalCallback();
      await intervalCallback();
      expect(mockOpsCollector.collect).toHaveBeenCalledTimes(2);

      getOpsMetrics$().subscribe({ complete: () => {} });
    });

    it('completes the metrics observable', async () => {
      await metricsService.setup({ http: httpMock });
      const { getOpsMetrics$ } = await metricsService.start();

      let completed = false;

      getOpsMetrics$().subscribe({
        complete: () => {
          completed = true;
        },
      });

      await metricsService.stop();

      expect(completed).toEqual(true);
    });
  });
});
