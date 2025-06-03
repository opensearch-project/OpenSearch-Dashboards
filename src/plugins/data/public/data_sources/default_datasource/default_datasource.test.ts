/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternsService } from '../../index_patterns';
import { defaultDataSourceMetadata } from '../constants';
import { DefaultDslDataSource } from './default_datasource';

describe('DefaultDslDataSource', () => {
  let indexPatternsMock: IndexPatternsService;

  beforeEach(() => {
    indexPatternsMock = ({
      ensureDefaultIndexPattern: jest.fn(),
      getCache: jest.fn(),
    } as unknown) as IndexPatternsService;
  });

  it('should ensure default index pattern and get cache', async () => {
    const dataSource = new DefaultDslDataSource({
      id: 'testId',
      name: 'testName',
      type: 'testType',
      metadata: defaultDataSourceMetadata,
      indexPatterns: indexPatternsMock,
    });

    await dataSource.getDataSet();

    expect(indexPatternsMock.ensureDefaultIndexPattern).toHaveBeenCalledTimes(1);
    expect(indexPatternsMock.getCache).toHaveBeenCalledTimes(1);
  });

  it('should return an empty dataset if getCache returns an empty array', async () => {
    indexPatternsMock.getCache.mockResolvedValue([]);
    const dataSource = new DefaultDslDataSource({
      id: 'testId',
      name: 'testName',
      type: 'testType',
      metadata: defaultDataSourceMetadata,
      indexPatterns: indexPatternsMock,
    });

    const result = await dataSource.getDataSet();
    expect(result.dataSets).toEqual([]);
  });

  it('should return a populated dataset if getCache returns non-empty array', async () => {
    const mockSavedObjects = [
      { id: '1', attributes: { title: 'Index1' }, references: [] },
      { id: '2', attributes: { title: 'Index2' }, references: [] },
    ];
    indexPatternsMock.getCache.mockResolvedValue(mockSavedObjects);
    const dataSource = new DefaultDslDataSource({
      id: 'testId',
      name: 'testName',
      type: 'testType',
      metadata: defaultDataSourceMetadata,
      indexPatterns: indexPatternsMock,
    });

    const result = await dataSource.getDataSet();
    expect(result.dataSets).toEqual([
      { id: '1', title: 'Index1' },
      { id: '2', title: 'Index2' },
    ]);
  });

  it('should handle errors thrown by getCache', async () => {
    indexPatternsMock.getCache.mockRejectedValue(new Error('Cache fetch failed'));
    const dataSource = new DefaultDslDataSource({
      id: 'testId',
      name: 'testName',
      type: 'testType',
      metadata: defaultDataSourceMetadata,
      indexPatterns: indexPatternsMock,
    });

    await expect(dataSource.getDataSet()).rejects.toThrow('Cache fetch failed');
  });

  it('should return true on default data source connection', async () => {
    const dataSource = new DefaultDslDataSource({
      id: 'testId',
      name: 'testName',
      type: 'testType',
      metadata: defaultDataSourceMetadata,
      indexPatterns: indexPatternsMock,
    });

    await expect(dataSource.testConnection()).resolves.toBe(true);
  });

  it('should return null', async () => {
    const dataSource = new DefaultDslDataSource({
      id: 'testId',
      name: 'testName',
      type: 'testType',
      metadata: defaultDataSourceMetadata,
      indexPatterns: indexPatternsMock,
    });

    const result = await dataSource.runQuery();
    expect(result).toStrictEqual({
      data: {},
    });
  });
});
