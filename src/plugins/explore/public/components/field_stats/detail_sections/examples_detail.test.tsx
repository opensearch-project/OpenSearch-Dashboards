/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { findTestSubject } from 'test_utils/helpers';
import { examplesDetailConfig } from './examples_detail';
import { FieldStatsItem, ExampleValue, Dataset } from '../utils/field_stats_types';
import { ExploreServices } from '../../../types';
import * as fieldStatsQueries from '../field_stats_queries';

jest.mock('../field_stats_queries');

const mockExecuteFieldStatsQuery = fieldStatsQueries.executeFieldStatsQuery as jest.MockedFunction<
  typeof fieldStatsQueries.executeFieldStatsQuery
>;

describe('ExamplesSection', () => {
  let component: ReactWrapper;

  const mockField: FieldStatsItem = {
    name: 'testField',
    type: 'object',
    docCount: 100,
    distinctCount: 50,
    docPercentage: 75,
  };

  const ExamplesSection = examplesDetailConfig.component;

  afterEach(() => {
    if (component) {
      component.unmount();
    }
  });

  it('renders examples table with data-test-subj', () => {
    const mockData: ExampleValue[] = [{ value: 'test1' }, { value: 'test2' }];
    component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);
    expect(findTestSubject(component, 'examplesSection').length).toBe(1);
  });

  it('displays string values correctly', () => {
    const mockData: ExampleValue[] = [{ value: 'stringValue' }];
    component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);
    expect(component.text()).toContain('stringValue');
  });

  it('displays numeric values correctly', () => {
    const mockData: ExampleValue[] = [{ value: 42 }, { value: 3.14 }];
    component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);
    expect(component.text()).toContain('42');
    expect(component.text()).toContain('3.14');
  });

  it('displays boolean values correctly', () => {
    const mockData: ExampleValue[] = [{ value: true }, { value: false }];
    component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);
    expect(component.text()).toContain('true');
    expect(component.text()).toContain('false');
  });

  it('displays object values as JSON strings', () => {
    const mockData: ExampleValue[] = [{ value: { nested: 'value', count: 10 } }];
    component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);
    expect(component.text()).toContain('"nested"');
    expect(component.text()).toContain('"value"');
  });

  it('handles empty data array', () => {
    const mockData: ExampleValue[] = [];
    component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);
    expect(findTestSubject(component, 'examplesSection').length).toBe(1);
  });

  it('displays multiple values', () => {
    const mockData: ExampleValue[] = [
      { value: 'value1' },
      { value: 'value2' },
      { value: 'value3' },
    ];
    component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);
    expect(component.text()).toContain('value1');
    expect(component.text()).toContain('value2');
    expect(component.text()).toContain('value3');
  });
});

describe('examplesDetailConfig', () => {
  const mockServices = ({
    data: {
      search: {
        searchSource: {},
      },
      dataViews: {},
      query: {
        filterManager: {},
      },
    },
  } as unknown) as ExploreServices;

  const mockDataset: Dataset = {
    id: 'test-dataset-id',
    type: 'INDEX_PATTERN',
    title: 'test-index',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct id and title', () => {
    expect(examplesDetailConfig.id).toBe('examples');
    expect(examplesDetailConfig.title).toBeDefined();
  });

  it('is applicable to geo_point, geo_shape, binary, and object types', () => {
    expect(examplesDetailConfig.applicableToTypes).toEqual([
      'geo_point',
      'geo_shape',
      'binary',
      'object',
    ]);
  });

  describe('fetchData', () => {
    it('calls executeFieldStatsQuery with correct parameters', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [{ _source: { testField: 'value1' } }, { _source: { testField: 'value2' } }],
        },
      });

      await examplesDetailConfig.fetchData('testField', mockDataset, mockServices);

      expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
        mockServices,
        expect.stringContaining('source = test-index'),
        'test-dataset-id',
        'INDEX_PATTERN'
      );
    });

    it('returns example values from query results', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [
            { _source: { myField: 'example1' } },
            { _source: { myField: 'example2' } },
            { _source: { myField: 'example3' } },
          ],
        },
      });

      const result = await examplesDetailConfig.fetchData('myField', mockDataset, mockServices);

      expect(result).toEqual([{ value: 'example1' }, { value: 'example2' }, { value: 'example3' }]);
    });

    it('filters out null and undefined values', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [
            { _source: { field: 'value1' } },
            { _source: { field: null } },
            { _source: { field: 'value2' } },
            { _source: {} },
          ],
        },
      });

      const result = await examplesDetailConfig.fetchData('field', mockDataset, mockServices);

      expect(result).toEqual([{ value: 'value1' }, { value: 'value2' }]);
    });

    it('handles empty hits array', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [],
        },
      });

      const result = await examplesDetailConfig.fetchData('field', mockDataset, mockServices);

      expect(result).toEqual([]);
    });

    it('handles missing hits in response', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({});

      const result = await examplesDetailConfig.fetchData('field', mockDataset, mockServices);

      expect(result).toEqual([]);
    });

    it('handles missing dataset id', async () => {
      const datasetWithoutId: Dataset = {
        type: 'INDEX_PATTERN',
        title: 'test-index',
      };

      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [{ _source: { field: 'value' } }],
        },
      });

      await examplesDetailConfig.fetchData('field', datasetWithoutId, mockServices);

      expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
        mockServices,
        expect.any(String),
        '',
        'INDEX_PATTERN'
      );
    });

    it('generates correct PPL query', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: { hits: [] },
      });

      await examplesDetailConfig.fetchData('testField', mockDataset, mockServices);

      const expectedQuery = `source = test-index
    | head 10
    | fields \`testField\`
    | where isnotnull(\`testField\`)`;

      expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
        mockServices,
        expectedQuery,
        'test-dataset-id',
        'INDEX_PATTERN'
      );
    });

    it('handles complex object values', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {
                complexField: { nested: { deeply: 'value' }, count: 42 },
              },
            },
          ],
        },
      });

      const result = await examplesDetailConfig.fetchData(
        'complexField',
        mockDataset,
        mockServices
      );

      expect(result).toEqual([{ value: { nested: { deeply: 'value' }, count: 42 } }]);
    });

    it('handles array values', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [{ _source: { arrayField: ['item1', 'item2', 'item3'] } }],
        },
      });

      const result = await examplesDetailConfig.fetchData('arrayField', mockDataset, mockServices);

      expect(result).toEqual([{ value: ['item1', 'item2', 'item3'] }]);
    });
  });
});
