/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { savedObjectsClientMock } from '../../../../core/server/mocks';
import {
  isAnalyticEngineDataSource,
  validateNotAnalyticEngineDataSource,
} from './analytic_engine_utils';

describe('analytic_engine_utils', () => {
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  beforeEach(() => {
    savedObjectsClient = savedObjectsClientMock.create();
  });

  describe('isAnalyticEngineDataSource', () => {
    it('should return false when dataSourceId is undefined', async () => {
      const result = await isAnalyticEngineDataSource(undefined, savedObjectsClient);
      expect(result).toBe(false);
      expect(savedObjectsClient.get).not.toHaveBeenCalled();
    });

    it('should return true when data source has AnalyticEngine engine type', async () => {
      savedObjectsClient.get.mockResolvedValueOnce({
        id: 'test-ds',
        type: 'data-source',
        attributes: {
          dataSourceEngineType: 'AnalyticEngine',
        },
        references: [],
      });

      const result = await isAnalyticEngineDataSource('test-ds', savedObjectsClient);
      expect(result).toBe(true);
      expect(savedObjectsClient.get).toHaveBeenCalledWith('data-source', 'test-ds');
    });

    it('should return false when data source has OpenSearch engine type', async () => {
      savedObjectsClient.get.mockResolvedValueOnce({
        id: 'test-ds',
        type: 'data-source',
        attributes: {
          dataSourceEngineType: 'OpenSearch',
        },
        references: [],
      });

      const result = await isAnalyticEngineDataSource('test-ds', savedObjectsClient);
      expect(result).toBe(false);
    });

    it('should return false when data source has no engine type', async () => {
      savedObjectsClient.get.mockResolvedValueOnce({
        id: 'test-ds',
        type: 'data-source',
        attributes: {},
        references: [],
      });

      const result = await isAnalyticEngineDataSource('test-ds', savedObjectsClient);
      expect(result).toBe(false);
    });

    it('should return false when savedObjectsClient.get throws error', async () => {
      savedObjectsClient.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await isAnalyticEngineDataSource('test-ds', savedObjectsClient);
      expect(result).toBe(false);
    });
  });

  describe('validateNotAnalyticEngineDataSource', () => {
    it('should not throw when dataSourceId is undefined', async () => {
      await expect(
        validateNotAnalyticEngineDataSource(undefined, savedObjectsClient)
      ).resolves.not.toThrow();
      expect(savedObjectsClient.get).not.toHaveBeenCalled();
    });

    it('should not throw when data source is not AnalyticEngine', async () => {
      savedObjectsClient.get.mockResolvedValueOnce({
        id: 'test-ds',
        type: 'data-source',
        attributes: {
          dataSourceEngineType: 'OpenSearch',
        },
        references: [],
      });

      await expect(
        validateNotAnalyticEngineDataSource('test-ds', savedObjectsClient)
      ).resolves.not.toThrow();
    });

    it('should throw AnalyticEngineError when data source is AnalyticEngine', async () => {
      savedObjectsClient.get.mockResolvedValueOnce({
        id: 'test-ds',
        type: 'data-source',
        attributes: {
          dataSourceEngineType: 'AnalyticEngine',
        },
        references: [],
      });

      await expect(
        validateNotAnalyticEngineDataSource('test-ds', savedObjectsClient)
      ).rejects.toThrow('This data source uses Analytic Engine which does not support DSL queries');

      try {
        await validateNotAnalyticEngineDataSource('test-ds', savedObjectsClient);
      } catch (error: any) {
        expect(error.name).toBe('AnalyticEngineError');
      }
    });

    it('should not throw when savedObjectsClient.get throws error', async () => {
      savedObjectsClient.get.mockRejectedValueOnce(new Error('Not found'));

      await expect(
        validateNotAnalyticEngineDataSource('test-ds', savedObjectsClient)
      ).resolves.not.toThrow();
    });
  });
});
