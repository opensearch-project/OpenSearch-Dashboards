/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternsService } from '../../index_patterns';
import { DataSourceUIGroupType } from '../datasource/types';
import { DEFAULT_DATA_SOURCE_DISPLAY_NAME } from '../register_default_datasource';
import { DefaultDslDataSource } from './default_datasource';

const defaultDataSourceMetadata = {
  ui: {
    label: DEFAULT_DATA_SOURCE_DISPLAY_NAME,
    typeLabel: DEFAULT_DATA_SOURCE_DISPLAY_NAME,
    groupType: DataSourceUIGroupType.defaultOpenSearchDataSource,
    selector: {
      displayDatasetsAsSource: true,
    },
  },
};

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

  it('should throw an error', async () => {
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
