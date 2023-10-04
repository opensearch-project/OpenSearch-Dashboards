/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternsService } from '../../index_patterns';
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
      name: 'testName',
      type: 'testType',
      metadata: {},
      indexPatterns: indexPatternsMock,
    });

    await dataSource.getDataSet();

    expect(indexPatternsMock.ensureDefaultIndexPattern).toHaveBeenCalledTimes(1);
    expect(indexPatternsMock.getCache).toHaveBeenCalledTimes(1);
  });

  it('should throw an error', async () => {
    const dataSource = new DefaultDslDataSource({
      name: 'testName',
      type: 'testType',
      metadata: {},
      indexPatterns: indexPatternsMock,
    });

    await expect(dataSource.testConnection()).resolves.toBe(true);
  });

  it('should return null', async () => {
    const dataSource = new DefaultDslDataSource({
      name: 'testName',
      type: 'testType',
      metadata: {},
      indexPatterns: indexPatternsMock,
    });

    const result = await dataSource.runQuery({});
    expect(result).toBeUndefined();
  });
});
