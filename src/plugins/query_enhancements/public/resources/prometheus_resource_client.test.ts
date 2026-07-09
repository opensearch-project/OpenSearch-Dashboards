/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import dateMath from '@elastic/datemath';
import { PrometheusResourceClient } from './prometheus_resource_client';
import { RESOURCE_TYPES } from '../../common/constants';

describe('PrometheusResourceClient', () => {
  let mockHttp: jest.Mocked<HttpSetup>;
  let client: PrometheusResourceClient;

  const testDataConnectionId = 'test-connection';
  const testMeta = { prometheusUrl: 'http://localhost:9090', customField: 'value' };

  // Fixed timestamps for testing
  const mockFromTime = 1609459200;
  const mockToTime = 1609460100;
  const testTimeRange = { from: 'now-15m', to: 'now' };

  beforeEach(() => {
    mockHttp = ({
      post: jest.fn().mockResolvedValue({ data: [] }),
    } as unknown) as jest.Mocked<HttpSetup>;

    client = new PrometheusResourceClient(mockHttp);

    // Mock dateMath.parse
    jest.spyOn(dateMath, 'parse').mockImplementation((value: string) => {
      if (value === 'now-15m') {
        return { unix: () => mockFromTime } as any;
      }
      if (value === 'now') {
        return { unix: () => mockToTime } as any;
      }
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('getMetrics', () => {
    it('should call the correct endpoint with meta and time range', async () => {
      await client.getMetrics(testDataConnectionId, testMeta, testTimeRange);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.METRICS,
            name: undefined,
          },
          content: {
            ...testMeta,
            start: mockFromTime,
            end: mockToTime,
          },
        }),
      });
    });

    it('should pass only meta when no time range provided', async () => {
      await client.getMetrics(testDataConnectionId, testMeta);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.METRICS,
            name: undefined,
          },
          content: testMeta,
        }),
      });
    });

    it('should work without meta and time range', async () => {
      await client.getMetrics(testDataConnectionId);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.METRICS,
            name: undefined,
          },
        }),
      });
    });
  });

  describe('getLabels', () => {
    it('should call the correct endpoint with meta, metric and time range', async () => {
      const metric = 'http_requests_total';
      await client.getLabels(testDataConnectionId, testMeta, metric, testTimeRange);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.LABELS,
            name: metric,
          },
          content: {
            ...testMeta,
            start: mockFromTime,
            end: mockToTime,
          },
        }),
      });
    });

    it('should call without metric when not provided', async () => {
      await client.getLabels(testDataConnectionId, testMeta, undefined, testTimeRange);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.LABELS,
            name: undefined,
          },
          content: {
            ...testMeta,
            start: mockFromTime,
            end: mockToTime,
          },
        }),
      });
    });
  });

  describe('getLabelValues', () => {
    it('should call the correct endpoint with meta, label and time range', async () => {
      const label = 'job';
      await client.getLabelValues(testDataConnectionId, testMeta, label, testTimeRange);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.LABEL_VALUES,
            name: label,
          },
          content: {
            ...testMeta,
            start: mockFromTime,
            end: mockToTime,
          },
        }),
      });
    });
  });

  describe('getMetricMetadata', () => {
    it('should call the correct endpoint with meta, metric and time range', async () => {
      const metric = 'http_requests_total';
      await client.getMetricMetadata(testDataConnectionId, testMeta, metric, testTimeRange);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.METRIC_METADATA,
            name: metric,
          },
          content: {
            ...testMeta,
            start: mockFromTime,
            end: mockToTime,
          },
        }),
      });
    });
  });

  describe('getSeries', () => {
    it('should call the correct endpoint with match, meta and time range', async () => {
      const match = '{__name__=~"metric1|metric2"}';
      await client.getSeries(testDataConnectionId, match, testMeta, testTimeRange);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.SERIES,
            name: match,
          },
          content: {
            ...testMeta,
            start: mockFromTime,
            end: mockToTime,
          },
        }),
      });
    });

    it('should call without meta when not provided', async () => {
      const match = '{__name__="metric1"}';
      await client.getSeries(testDataConnectionId, match, undefined, testTimeRange);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/enhancements/resources', {
        body: JSON.stringify({
          connection: {
            id: testDataConnectionId,
            type: 'prometheus',
          },
          resource: {
            type: RESOURCE_TYPES.PROMETHEUS.SERIES,
            name: match,
          },
          content: {
            start: mockFromTime,
            end: mockToTime,
          },
        }),
      });
    });
  });

  describe('toContent behavior', () => {
    it('should merge meta with time range when both provided', async () => {
      await client.getMetrics(testDataConnectionId, testMeta, testTimeRange);

      const callBody = JSON.parse((mockHttp.post as jest.Mock).mock.calls[0][1].body);
      expect(callBody.content).toEqual({
        ...testMeta,
        start: mockFromTime,
        end: mockToTime,
      });
    });

    it('should return only meta when time range parsing fails', async () => {
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      jest.spyOn(dateMath, 'parse').mockReturnValue(null);

      await client.getMetrics(testDataConnectionId, testMeta, testTimeRange);

      const callBody = JSON.parse((mockHttp.post as jest.Mock).mock.calls[0][1].body);
      expect(callBody.content).toEqual(testMeta);
    });

    it('should return meta when no time range provided', async () => {
      await client.getMetrics(testDataConnectionId, testMeta, undefined);

      const callBody = JSON.parse((mockHttp.post as jest.Mock).mock.calls[0][1].body);
      expect(callBody.content).toEqual(testMeta);
    });

    it('should return undefined when neither meta nor time range provided', async () => {
      await client.getMetrics(testDataConnectionId);

      const callBody = JSON.parse((mockHttp.post as jest.Mock).mock.calls[0][1].body);
      expect(callBody.content).toBeUndefined();
    });
  });
});
