/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  filterDatasetFields,
  transformFieldStatsResult,
  getApplicableSections,
  fetchFieldDetails,
  createRowExpandHandler,
} from './field_stats_utils';
import * as fieldStatsUtils from './field_stats_utils';
import { DETAIL_SECTIONS } from '../field_stats_detail_sections';
import { IndexPatternField, DetailSectionConfig, FieldStatsItem } from './field_stats_types';
import {
  createMockServices,
  createMockDataset,
  createMockFieldStatsItem,
  createMockDetailSection,
} from './field_stats.stubs';

jest.mock('../field_stats_detail_sections', () => ({
  DETAIL_SECTIONS: [],
}));

describe('field_stats_utils', () => {
  describe('filterDatasetFields', () => {
    it('returns empty array when dataset is null', () => {
      const result = filterDatasetFields(null);
      expect(result).toEqual([]);
    });

    it('returns empty array when dataset has no fields', () => {
      const dataset = { metaFields: [] };
      const result = filterDatasetFields(dataset);
      expect(result).toEqual([]);
    });

    it('filters out meta fields', () => {
      const dataset = {
        metaFields: ['_id', '_index'],
        fields: {
          getAll: () =>
            [
              { name: '_id', type: 'string' },
              { name: 'field1', type: 'string' },
              { name: '_index', type: 'string' },
            ] as IndexPatternField[],
        },
      };
      const result = filterDatasetFields(dataset);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('field1');
    });

    it('filters out multi-fields with parent', () => {
      const dataset = {
        metaFields: [],
        fields: {
          getAll: () =>
            [
              { name: 'field1', type: 'text' },
              { name: 'field1.keyword', type: 'keyword', subType: { multi: { parent: 'field1' } } },
            ] as IndexPatternField[],
        },
      };
      const result = filterDatasetFields(dataset);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('field1');
    });

    it('filters out scripted fields', () => {
      const dataset = {
        metaFields: [],
        fields: {
          getAll: () =>
            [
              { name: 'field1', type: 'string', scripted: false },
              { name: 'scriptedField', type: 'number', scripted: true },
            ] as IndexPatternField[],
        },
      };
      const result = filterDatasetFields(dataset);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('field1');
    });

    it('returns all non-filtered fields', () => {
      const dataset = {
        metaFields: ['_id'],
        fields: {
          getAll: () =>
            [
              { name: 'field1', type: 'string' },
              { name: 'field2', type: 'number' },
              { name: '_id', type: 'string' },
            ] as IndexPatternField[],
        },
      };
      const result = filterDatasetFields(dataset);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('field1');
      expect(result[1].name).toBe('field2');
    });
  });

  describe('transformFieldStatsResult', () => {
    it('transforms result with valid data', () => {
      const result = {
        hits: {
          hits: [
            {
              _source: {
                count: 100,
                dc: 25,
                percentage_total: 75.5,
              },
            },
          ],
        },
      };
      const transformed = transformFieldStatsResult('fieldName', 'string', result);
      expect(transformed).toEqual({
        name: 'fieldName',
        type: 'string',
        docCount: 100,
        distinctCount: 25,
        docPercentage: 75.5,
      });
    });

    it('handles missing hits', () => {
      const result = {};
      const transformed = transformFieldStatsResult('fieldName', 'number', result);
      expect(transformed).toEqual({
        name: 'fieldName',
        type: 'number',
        docCount: 0,
        distinctCount: 0,
        docPercentage: 0,
      });
    });

    it('handles empty hits array', () => {
      const result = { hits: { hits: [] } };
      const transformed = transformFieldStatsResult('fieldName', 'date', result);
      expect(transformed).toEqual({
        name: 'fieldName',
        type: 'date',
        docCount: 0,
        distinctCount: 0,
        docPercentage: 0,
      });
    });

    it('handles missing fields in source', () => {
      const result = {
        hits: {
          hits: [{ _source: {} }],
        },
      };
      const transformed = transformFieldStatsResult('fieldName', 'string', result);
      expect(transformed).toEqual({
        name: 'fieldName',
        type: 'string',
        docCount: 0,
        distinctCount: 0,
        docPercentage: 0,
      });
    });
  });

  describe('getApplicableSections', () => {
    const mockSections: DetailSectionConfig[] = [
      createMockDetailSection({ id: 'topValues', applicableToTypes: ['string', 'keyword'] }),
      createMockDetailSection({
        id: 'numericSummary',
        applicableToTypes: ['number', 'long', 'integer'],
      }),
      createMockDetailSection({ id: 'dateRange', applicableToTypes: ['date'] }),
    ];

    beforeEach(() => {
      (DETAIL_SECTIONS as any).length = 0;
      (DETAIL_SECTIONS as any).push(...mockSections);
    });

    it('returns applicable sections for string type', () => {
      const sections = getApplicableSections('string');
      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe('topValues');
    });

    it('returns applicable sections for number type', () => {
      const sections = getApplicableSections('number');
      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe('numericSummary');
    });

    it('returns applicable sections for date type', () => {
      const sections = getApplicableSections('date');
      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe('dateRange');
    });

    it('normalizes field type to lowercase', () => {
      const sections = getApplicableSections('STRING');
      expect(sections).toHaveLength(1);
      expect(sections[0].id).toBe('topValues');
    });

    it('returns empty array for unknown type', () => {
      const sections = getApplicableSections('unknown');
      expect(sections).toHaveLength(0);
    });
  });

  describe('fetchFieldDetails', () => {
    const mockServices = createMockServices();
    const mockDataset = createMockDataset({ id: 'test-index', title: 'test-index' });

    const mockTopValuesSection = createMockDetailSection({
      id: 'topValues',
      applicableToTypes: ['string'],
      fetchData: jest.fn().mockResolvedValue([{ value: 'test', count: 10 }]),
    });

    const mockNumericSection = createMockDetailSection({
      id: 'numericSummary',
      applicableToTypes: ['number'],
      fetchData: jest.fn().mockResolvedValue({ min: 0, max: 100, avg: 50, median: 45 }),
    });

    beforeEach(() => {
      (DETAIL_SECTIONS as any).length = 0;
      jest.clearAllMocks();
    });

    it('fetches details for applicable sections', async () => {
      (DETAIL_SECTIONS as any).push(mockTopValuesSection);

      const details = await fetchFieldDetails('fieldName', 'string', mockDataset, mockServices);

      expect(mockTopValuesSection.fetchData).toHaveBeenCalledWith(
        'fieldName',
        expect.objectContaining({ id: 'test-index', type: 'INDEX_PATTERN' }),
        mockServices
      );
      expect(details.topValues).toEqual([{ value: 'test', count: 10 }]);
    });

    it('fetches multiple sections in parallel', async () => {
      const section1 = createMockDetailSection({
        id: 'section1',
        applicableToTypes: ['string'],
        fetchData: jest.fn().mockResolvedValue({ data: 'section1' }),
      });
      const section2 = createMockDetailSection({
        id: 'section2',
        applicableToTypes: ['string'],
        fetchData: jest.fn().mockResolvedValue({ data: 'section2' }),
      });

      (DETAIL_SECTIONS as any).push(section1, section2);

      const details = await fetchFieldDetails('fieldName', 'string', mockDataset, mockServices);

      expect(section1.fetchData).toHaveBeenCalled();
      expect(section2.fetchData).toHaveBeenCalled();
      expect((details as any).section1).toEqual({ data: 'section1' });
      expect((details as any).section2).toEqual({ data: 'section2' });
    });

    it('handles section fetch errors gracefully', async () => {
      const errorSection = createMockDetailSection({
        id: 'errorSection',
        applicableToTypes: ['string'],
        fetchData: jest.fn().mockRejectedValue(new Error('Fetch failed')),
      });

      (DETAIL_SECTIONS as any).push(errorSection);

      const details = await fetchFieldDetails('fieldName', 'string', mockDataset, mockServices);

      expect((details as any).errorSection).toEqual({ error: true });
    });

    it('uses default type when dataset type is missing', async () => {
      const datasetWithoutType = { id: 'test', title: 'test', fields: {}, metaFields: [] };

      (DETAIL_SECTIONS as any).push(mockTopValuesSection);

      await fetchFieldDetails('fieldName', 'string', datasetWithoutType, mockServices);

      expect(mockTopValuesSection.fetchData).toHaveBeenCalledWith(
        'fieldName',
        expect.objectContaining({ type: 'INDEX_PATTERN' }),
        mockServices
      );
    });

    it('returns empty object when no sections applicable', async () => {
      (DETAIL_SECTIONS as any).push(mockNumericSection);

      const details = await fetchFieldDetails('fieldName', 'string', mockDataset, mockServices);

      expect(Object.keys(details)).toHaveLength(0);
    });
  });

  describe('createRowExpandHandler', () => {
    const mockServices = createMockServices();
    const mockDataset = createMockDataset({ id: 'test-index', title: 'test-index' });
    const mockFieldStats: Record<string, FieldStatsItem> = {
      field1: createMockFieldStatsItem({ name: 'field1', type: 'string', docPercentage: 75 }),
      field2: createMockFieldStatsItem({
        name: 'field2',
        type: 'number',
        docCount: 200,
        distinctCount: 100,
        docPercentage: 90,
      }),
    };

    let expandedRows: Set<string>;
    let setExpandedRows: jest.Mock;
    let fieldDetails: any;
    let setFieldDetails: jest.Mock;
    let detailsLoading: Set<string>;
    let setDetailsLoading: jest.Mock;

    beforeEach(() => {
      expandedRows = new Set();
      setExpandedRows = jest.fn();
      fieldDetails = {};
      setFieldDetails = jest.fn();
      detailsLoading = new Set();
      setDetailsLoading = jest.fn();
    });

    it('expands a collapsed row', async () => {
      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('field1');

      expect(setExpandedRows).toHaveBeenCalledWith(new Set(['field1']));
    });

    it('collapses an expanded row', async () => {
      expandedRows = new Set(['field1']);
      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('field1');

      expect(setExpandedRows).toHaveBeenCalledWith(new Set());
    });

    it('does not fetch details if field not in fieldStats', async () => {
      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('nonExistentField');

      expect(setFieldDetails).not.toHaveBeenCalled();
      expect(setDetailsLoading).not.toHaveBeenCalled();
    });

    it('does not fetch details if dataset is missing', async () => {
      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        null,
        mockServices
      );

      await handler('field1');

      expect(setFieldDetails).not.toHaveBeenCalled();
      expect(setDetailsLoading).not.toHaveBeenCalled();
    });

    it('does not fetch details if already fetched', async () => {
      fieldDetails = { field1: { topValues: [] } };
      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('field1');

      expect(setExpandedRows).toHaveBeenCalled();
      expect(setDetailsLoading).not.toHaveBeenCalled();
    });

    it('sets loading state during fetch', async () => {
      const mockFetchFieldDetails = jest.fn().mockResolvedValue({ topValues: [] });
      jest.spyOn(fieldStatsUtils, 'fetchFieldDetails').mockImplementation(mockFetchFieldDetails);

      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('field1');

      expect(setDetailsLoading).toHaveBeenCalledWith(expect.any(Function));
      const firstCall = setDetailsLoading.mock.calls[0][0];
      const newLoadingSet = firstCall(detailsLoading);
      expect(newLoadingSet.has('field1')).toBe(true);
    });

    it('clears loading state after successful fetch', async () => {
      const mockFetchFieldDetails = jest.fn().mockResolvedValue({ topValues: [] });
      jest.spyOn(fieldStatsUtils, 'fetchFieldDetails').mockImplementation(mockFetchFieldDetails);

      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('field1');

      expect(setDetailsLoading).toHaveBeenCalledTimes(2);
      const secondCall = setDetailsLoading.mock.calls[1][0];
      const finalLoadingSet = secondCall(new Set(['field1']));
      expect(finalLoadingSet.has('field1')).toBe(false);
    });

    it('handles section fetch errors gracefully', async () => {
      (DETAIL_SECTIONS as any).length = 0;
      const errorSection = createMockDetailSection({
        id: 'errorSection',
        applicableToTypes: ['string'],
        fetchData: jest.fn().mockRejectedValue(new Error('Fetch failed')),
      });
      (DETAIL_SECTIONS as any).push(errorSection);

      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('field1');

      expect(setFieldDetails).toHaveBeenCalledWith(expect.any(Function));
      const call = setFieldDetails.mock.calls[0][0];
      const newDetails = call(fieldDetails);
      expect(newDetails.field1.errorSection).toEqual({ error: true });
    });

    it('updates field details after successful fetch', async () => {
      (DETAIL_SECTIONS as any).length = 0;
      const mockDetails = { topValues: [{ value: 'test', count: 10 }] };
      const successSection = createMockDetailSection({
        id: 'topValues',
        applicableToTypes: ['string'],
        fetchData: jest.fn().mockResolvedValue(mockDetails.topValues),
      });
      (DETAIL_SECTIONS as any).push(successSection);

      const handler = createRowExpandHandler(
        expandedRows,
        setExpandedRows,
        mockFieldStats,
        fieldDetails,
        setFieldDetails,
        detailsLoading,
        setDetailsLoading,
        mockDataset,
        mockServices
      );

      await handler('field1');

      expect(setFieldDetails).toHaveBeenCalledWith(expect.any(Function));
      const call = setFieldDetails.mock.calls[0][0];
      const newDetails = call(fieldDetails);
      expect(newDetails.field1.topValues).toEqual(mockDetails.topValues);
    });
  });
});
