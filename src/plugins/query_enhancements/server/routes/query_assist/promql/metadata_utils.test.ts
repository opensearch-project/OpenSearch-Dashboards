/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { promqlHandler } from './metadata_utils';
import { prometheusManager } from '../../../connections/managers/prometheus_manager';
import { LanguageHandlerContext } from '../language_handlers';
import { RESOURCE_TYPES } from '../../../../common/constants';

jest.mock('../../../connections/managers/prometheus_manager', () => ({
  prometheusManager: {
    getResources: jest.fn(),
  },
}));

const mockGetResources = prometheusManager.getResources as jest.Mock;

const createMockHandlerContext = (): LanguageHandlerContext => ({
  context: {} as any,
  request: {} as any,
  index: 'my_prometheus',
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  } as any,
});

describe('promqlHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdditionalAgentParameters', () => {
    it('returns formatted metadata when API calls succeed', async () => {
      mockGetResources
        .mockResolvedValueOnce({
          status: 'success',
          data: ['label1', 'label2', '__name__'],
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: ['http_requests_total', 'process_cpu_seconds'],
        });

      const handlerContext = createMockHandlerContext();
      const result = await promqlHandler.getAdditionalAgentParameters(handlerContext);

      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toContain('Available labels: label1, label2, __name__');
      expect(result.metadata).toContain('- http_requests_total');
      expect(result.metadata).toContain('- process_cpu_seconds');
    });

    it('handles empty responses gracefully', async () => {
      mockGetResources
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] });

      const handlerContext = createMockHandlerContext();
      const result = await promqlHandler.getAdditionalAgentParameters(handlerContext);

      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toContain('Available labels:');
      expect(result.metadata).toContain('Available metrics:');
    });

    it('handles failed API responses', async () => {
      mockGetResources
        .mockResolvedValueOnce({ status: 'error', data: [] })
        .mockResolvedValueOnce({ status: 'error', data: [] });

      const handlerContext = createMockHandlerContext();
      const result = await promqlHandler.getAdditionalAgentParameters(handlerContext);

      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toContain('Available labels:');
    });

    it('returns empty metadata and logs error when API throws', async () => {
      mockGetResources.mockRejectedValue(new Error('Network error'));

      const handlerContext = createMockHandlerContext();
      const result = await promqlHandler.getAdditionalAgentParameters(handlerContext);

      // Inner catch returns empty defaults, so we get formatted empty metadata
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toContain('Available labels:');
      expect(result.metadata).toContain('Available metrics:');
      expect(handlerContext.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch Prometheus metadata')
      );
    });

    it('calls getResources with correct parameters', async () => {
      mockGetResources
        .mockResolvedValueOnce({ status: 'success', data: [] })
        .mockResolvedValueOnce({ status: 'success', data: [] });

      const handlerContext = createMockHandlerContext();
      await promqlHandler.getAdditionalAgentParameters(handlerContext);

      expect(mockGetResources).toHaveBeenCalledTimes(2);
      expect(mockGetResources).toHaveBeenCalledWith(
        handlerContext.context,
        handlerContext.request,
        {
          dataSourceName: 'my_prometheus',
          resourceType: RESOURCE_TYPES.PROMETHEUS.LABELS,
          resourceName: undefined,
          query: {},
        }
      );
      expect(mockGetResources).toHaveBeenCalledWith(
        handlerContext.context,
        handlerContext.request,
        {
          dataSourceName: 'my_prometheus',
          resourceType: RESOURCE_TYPES.PROMETHEUS.METRICS,
          resourceName: undefined,
          query: {},
        }
      );
    });

    it('lists metrics from metrics endpoint', async () => {
      mockGetResources
        .mockResolvedValueOnce({ status: 'success', data: ['label1'] })
        .mockResolvedValueOnce({
          status: 'success',
          data: ['metric_a', 'metric_b', 'metric_c'],
        });

      const handlerContext = createMockHandlerContext();
      const result = await promqlHandler.getAdditionalAgentParameters(handlerContext);

      expect(result.metadata).toContain('- metric_a');
      expect(result.metadata).toContain('- metric_b');
      expect(result.metadata).toContain('- metric_c');
    });
  });
});
