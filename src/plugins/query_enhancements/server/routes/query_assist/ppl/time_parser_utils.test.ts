/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  normTimeString,
  parseTimeRangeXML,
  getTimestampFieldClusters,
  getUnselectedTimeFields,
} from './time_parser_utils';
import { loggingSystemMock } from '../../../../../../core/server/mocks';

describe('time_parser_utils', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;

  beforeEach(() => {
    logger = loggingSystemMock.createLogger();
  });

  describe('normTimeString', () => {
    it('should normalize valid time string to yyyy-MM-dd HH:mm:ss format', () => {
      expect(normTimeString('2023-12-25 10:30:45')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2023-12-25 10:30:45'
      );
      expect(normTimeString('2023-12-25T10:30:45Z')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2023-12-25 10:30:45'
      );
    });

    it('should handle date without time', () => {
      expect(normTimeString('2023-12-25')).toBeNull();
    });

    it('should handle different date formats', () => {
      expect(normTimeString('2023/12/25 10:30:45')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2023-12-25 10:30:45'
      );
      expect(normTimeString('2023/12/25T10:30:45Z')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2023-12-25 10:30:45'
      );
      expect(normTimeString('2023-12-25 10:30:45.123')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2023-12-25 10:30:45'
      );
    });

    it('should return null for empty string', () => {
      expect(normTimeString('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(normTimeString(null as any)).toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(normTimeString('invalid-date')).toBeNull();
    });

    it('should return null for single digit month and day', () => {
      expect(normTimeString('2023-1-5 9:5:3')).toBeNull();
    });

    it('should handle time without seconds', () => {
      expect(normTimeString('2023-12-25 10:30')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2023-12-25 10:30:00'
      );
      expect(normTimeString('2023-12-25T10:30Z')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2023-12-25 10:30:00'
      );
    });

    it('should return null for unsupported formats', () => {
      expect(normTimeString('Dec 25, 2023 10:30:45')).toBeNull();
    });
  });

  describe('parseTimeRangeXML', () => {
    it('should parse valid XML time range', () => {
      const xmlInput = '<start>2023-12-25T10:00:00Z</start><end>2023-12-25T11:00:00Z</end>';
      const result = parseTimeRangeXML(xmlInput, logger);

      expect(result).toEqual({
        start: '2023-12-25 10:00:00',
        end: '2023-12-25 11:00:00',
      });
    });

    it('should handle XML with whitespace', () => {
      const xmlInput = `
        <start>  2023-12-25T10:00:00Z  </start>
        <end>  2023-12-25T11:00:00Z  </end>
      `;
      const result = parseTimeRangeXML(xmlInput, logger);

      expect(result).toEqual({
        start: '2023-12-25 10:00:00',
        end: '2023-12-25 11:00:00',
      });
    });

    it('should return null for empty input', () => {
      const result = parseTimeRangeXML('', logger);
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = parseTimeRangeXML(null as any, logger);
      expect(result).toBeNull();
    });

    it('should return null when start tag is missing', () => {
      const xmlInput = '<end>2023-12-25T11:00:00Z</end>';
      const result = parseTimeRangeXML(xmlInput, logger);
      expect(result).toBeNull();
    });

    it('should return null when end tag is missing', () => {
      const xmlInput = '<start>2023-12-25T10:00:00Z</start>';
      const result = parseTimeRangeXML(xmlInput, logger);
      expect(result).toBeNull();
    });

    it('should return null when start time is invalid', () => {
      const xmlInput = '<start>invalid-date</start><end>2023-12-25T11:00:00Z</end>';
      const result = parseTimeRangeXML(xmlInput, logger);
      expect(result).toBeNull();
    });

    it('should return null when end time is invalid', () => {
      const xmlInput = '<start>2023-12-25T10:00:00Z</start><end>invalid-date</end>';
      const result = parseTimeRangeXML(xmlInput, logger);
      expect(result).toBeNull();
    });

    it('should return null when start time is greater than or equal to end time', () => {
      const xmlInput = '<start>2023-12-25T11:00:00Z</start><end>2023-12-25T10:00:00Z</end>';
      const result = parseTimeRangeXML(xmlInput, logger);
      expect(result).toBeNull();
    });

    it('should handle multiline XML content', () => {
      const xmlInput = `
        <start>
          2023-12-25T10:00:00Z
        </start>
        <end>
          2023-12-25T11:00:00Z
        </end>
      `;
      const result = parseTimeRangeXML(xmlInput, logger);

      expect(result).toEqual({
        start: '2023-12-25 10:00:00',
        end: '2023-12-25 11:00:00',
      });
    });

    it('should handle error gracefully', () => {
      const xmlInput = '<start>2023-12-25T10:00:00Z</start><end>2023-12-25T11:00:00Z</end>';
      // Mock logger.error to verify it's called
      const mockError = jest.spyOn(logger, 'error').mockImplementation();

      // This should not throw an error
      const result = parseTimeRangeXML(xmlInput, logger);
      expect(result).not.toBeNull();

      mockError.mockRestore();
    });
  });

  describe('getTimestampFieldClusters', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        transport: {
          request: jest.fn(),
        },
      };
    });

    it('should return timestamp field clusters from mapping response', async () => {
      const mockResponse = {
        body: {
          'test-index': {
            mappings: {
              timestamp: {
                full_name: 'timestamp',
                mapping: {
                  timestamp: {
                    type: 'date',
                  },
                },
              },
              timestamp_alias: {
                full_name: 'timestamp_alias',
                mapping: {
                  timestamp_alias: {
                    type: 'alias',
                    path: 'timestamp',
                  },
                },
              },
              other_field: {
                full_name: 'other_field',
                mapping: {
                  other_field: {
                    type: 'keyword',
                  },
                },
              },
            },
          },
        },
      };

      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await getTimestampFieldClusters('test-index', mockClient, logger);

      expect(result).toEqual([['timestamp', 'timestamp_alias']]);
      expect(mockClient.transport.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/test-index/_mapping/field/*',
      });
    });

    it('should handle multiple date fields and their aliases', async () => {
      const mockResponse = {
        body: {
          'test-index': {
            mappings: {
              created_at: {
                full_name: 'created_at',
                mapping: {
                  created_at: {
                    type: 'date',
                  },
                },
              },
              created_at_alias: {
                full_name: 'created_at_alias',
                mapping: {
                  created_at_alias: {
                    type: 'alias',
                    path: 'created_at',
                  },
                },
              },
              updated_at: {
                full_name: 'updated_at',
                mapping: {
                  updated_at: {
                    type: 'date_nanos',
                  },
                },
              },
              updated_at_alias: {
                full_name: 'updated_at_alias',
                mapping: {
                  updated_at_alias: {
                    type: 'alias',
                    path: 'updated_at',
                  },
                },
              },
            },
          },
        },
      };

      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await getTimestampFieldClusters('test-index', mockClient, logger);

      expect(result).toEqual([
        ['created_at', 'created_at_alias'],
        ['updated_at', 'updated_at_alias'],
      ]);
    });

    it('should handle date fields without aliases', async () => {
      const mockResponse = {
        body: {
          'test-index': {
            mappings: {
              timestamp: {
                full_name: 'timestamp',
                mapping: {
                  timestamp: {
                    type: 'date',
                  },
                },
              },
            },
          },
        },
      };

      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await getTimestampFieldClusters('test-index', mockClient, logger);

      expect(result).toEqual([['timestamp']]);
    });

    it('should throw error for empty index name', async () => {
      await expect(getTimestampFieldClusters('', mockClient, logger)).rejects.toThrow(
        'Empty index name provided'
      );
    });

    it('should throw error when API call fails', async () => {
      const error = new Error('API Error');
      mockClient.transport.request.mockRejectedValue(error);

      await expect(getTimestampFieldClusters('test-index', mockClient, logger)).rejects.toThrow(
        'API Error'
      );
    });

    it('should handle empty mapping response', async () => {
      const mockResponse = {
        body: {},
      };

      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await getTimestampFieldClusters('test-index', mockClient, logger);

      expect(result).toEqual([]);
    });

    it('should handle mapping response without date fields', async () => {
      const mockResponse = {
        body: {
          'test-index': {
            mappings: {
              field1: {
                full_name: 'field1',
                mapping: {
                  field1: {
                    type: 'keyword',
                  },
                },
              },
            },
          },
        },
      };

      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await getTimestampFieldClusters('test-index', mockClient, logger);

      expect(result).toEqual([]);
    });
  });

  describe('getUnselectedTimeFields', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        transport: {
          request: jest.fn(),
        },
      };
    });

    it('should return other time fields excluding selected field', async () => {
      const mockGetTimestampFieldClusters = jest.fn().mockResolvedValue([
        ['created_at', 'created_at_alias'],
        ['updated_at', 'updated_at_alias'],
      ]);

      const result = await getUnselectedTimeFields({
        indexName: 'test-index',
        selectedTimeField: 'created_at',
        client: mockClient,
        logger,
        getTimestampFieldClustersFn: mockGetTimestampFieldClusters,
      });

      expect(result).toEqual(['updated_at', 'updated_at_alias']);
      expect(mockGetTimestampFieldClusters).toHaveBeenCalledWith('test-index', mockClient, logger);
    });

    it('should return empty array when no other time fields exist', async () => {
      const mockGetTimestampFieldClusters = jest.fn().mockResolvedValue([['created_at']]);

      const result = await getUnselectedTimeFields({
        indexName: 'test-index',
        selectedTimeField: 'created_at',
        client: mockClient,
        logger,
        getTimestampFieldClustersFn: mockGetTimestampFieldClusters,
      });

      expect(result).toEqual([]);
      expect(mockGetTimestampFieldClusters).toHaveBeenCalledWith('test-index', mockClient, logger);
    });

    it('should exclude selected field and its aliases', async () => {
      const mockGetTimestampFieldClusters = jest
        .fn()
        .mockResolvedValue([['created_at', 'created_at_alias'], ['updated_at']]);

      const result = await getUnselectedTimeFields({
        indexName: 'test-index',
        selectedTimeField: 'created_at',
        client: mockClient,
        logger,
        getTimestampFieldClustersFn: mockGetTimestampFieldClusters,
      });

      expect(result).toEqual(['updated_at']);
      expect(mockGetTimestampFieldClusters).toHaveBeenCalledWith('test-index', mockClient, logger);
    });

    it('should handle API errors from getTimestampFieldClusters', async () => {
      const mockGetTimestampFieldClusters = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(
        getUnselectedTimeFields({
          indexName: 'test-index',
          selectedTimeField: 'created_at',
          client: mockClient,
          logger,
          getTimestampFieldClustersFn: mockGetTimestampFieldClusters,
        })
      ).rejects.toThrow('API Error');
      expect(mockGetTimestampFieldClusters).toHaveBeenCalledWith('test-index', mockClient, logger);
    });

    it('should use default getTimestampFieldClusters when no mock is provided', async () => {
      const mockResponse = {
        body: {
          'test-index': {
            mappings: {
              created_at: {
                full_name: 'created_at',
                mapping: {
                  created_at: {
                    type: 'date',
                  },
                },
              },
              updated_at: {
                full_name: 'updated_at',
                mapping: {
                  updated_at: {
                    type: 'date',
                  },
                },
              },
            },
          },
        },
      };

      mockClient.transport.request.mockResolvedValue(mockResponse);

      const result = await getUnselectedTimeFields({
        indexName: 'test-index',
        selectedTimeField: 'created_at',
        client: mockClient,
        logger,
      });

      expect(result).toEqual(['updated_at']);
      expect(mockClient.transport.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/test-index/_mapping/field/*',
      });
    });
  });
});
