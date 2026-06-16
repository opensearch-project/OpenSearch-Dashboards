/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { shallow } from 'enzyme';

import IndexPatternSelect from './index_pattern_select';
import { savedObjectsServiceMock } from '../../../../../core/public/mocks';

describe('IndexPatternSelect', () => {
  const savedObjectsClient = savedObjectsServiceMock.createStartContract().client;
  const onChangeMock = jest.fn();

  jest.useFakeTimers();

  beforeEach(() => {
    onChangeMock.mockReset();

    jest.spyOn(savedObjectsClient, 'get').mockReturnValue(
      // @ts-ignore
      Promise.resolve({
        id: '3',
        type: 'data-source',
        references: [{ id: 'testDataSourceId3', type: 'data-source' }],
        attributes: { title: 'testTitle3' },
      })
    );

    jest.spyOn(savedObjectsClient, 'bulkGet').mockReturnValue(
      // @ts-ignore
      Promise.resolve({
        savedObjects: [
          {
            id: '4',
            type: 'data-source',
            attributes: { title: 'testTitle4' },
          },
        ],
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use the data-source IDs to make a bulkGet call', async () => {
    jest.spyOn(savedObjectsClient, 'find').mockReturnValue(
      // @ts-ignore
      Promise.resolve({
        total: 2,
        perPage: 10,
        page: 1,
        savedObjects: [
          {
            id: '1',
            type: 'data-source',
            references: [{ id: 'testDataSourceId1', type: 'data-source' }],
            attributes: { title: 'testTitle1' },
          },
          {
            id: '2',
            type: 'data-source',
            references: [{ id: 'testDataSourceId2', type: 'data-source' }],
            attributes: { title: 'testTitle2' },
          },
        ],
      })
    );

    const compInstance = shallow<IndexPatternSelect>(
      <IndexPatternSelect
        placeholder={'test index pattern'}
        indexPatternId={'testId'}
        onChange={onChangeMock}
        data-test-subj={'testId'}
        savedObjectsClient={savedObjectsClient}
      />
    ).instance();

    const call = compInstance.debouncedFetch('');
    jest.advanceTimersByTime(10000);
    await call;
    await compInstance.debouncedFetch.flush();

    expect(savedObjectsClient.bulkGet).toBeCalledWith([
      { id: 'testDataSourceId1', type: 'data-source' },
      { id: 'testDataSourceId2', type: 'data-source' },
    ]);
  });

  it('should combine saved-objects with common data-source IDs when making a bulkGet call', async () => {
    jest.spyOn(savedObjectsClient, 'find').mockReturnValue(
      // @ts-ignore
      Promise.resolve({
        total: 2,
        perPage: 10,
        page: 1,
        savedObjects: [
          {
            id: '1',
            type: 'data-source',
            references: [{ id: 'testDataSourceId0', type: 'data-source' }],
            attributes: { title: 'testTitle1' },
          },
          {
            id: '2',
            type: 'data-source',
            references: [{ id: 'testDataSourceId0', type: 'data-source' }],
            attributes: { title: 'testTitle2' },
          },
        ],
      })
    );

    const compInstance = shallow<IndexPatternSelect>(
      <IndexPatternSelect
        placeholder={'test index pattern'}
        indexPatternId={'testId'}
        onChange={onChangeMock}
        data-test-subj={'testId'}
        savedObjectsClient={savedObjectsClient}
      />
    ).instance();

    const call = compInstance.debouncedFetch('');
    jest.advanceTimersByTime(10000);
    await call;
    await compInstance.debouncedFetch.flush();

    expect(savedObjectsClient.bulkGet).toBeCalledWith([
      { id: 'testDataSourceId0', type: 'data-source' },
    ]);
  });

  it('should apply indexPatternFilter when provided', async () => {
    jest.spyOn(savedObjectsClient, 'find').mockReturnValue(
      // @ts-ignore
      Promise.resolve({
        total: 3,
        perPage: 10,
        page: 1,
        savedObjects: [
          {
            id: '1',
            type: 'index-pattern',
            attributes: { title: 'pattern1' },
            references: [],
          },
          {
            id: '2',
            type: 'index-pattern',
            attributes: { title: 'pattern2' },
            references: [],
          },
          {
            id: '3',
            type: 'index-pattern',
            attributes: { title: 'pattern3' },
            references: [],
          },
        ],
      })
    );

    const filterFn = jest.fn((indexPattern) => indexPattern.id !== '2');

    const compInstance = shallow<IndexPatternSelect>(
      <IndexPatternSelect
        placeholder={'test index pattern'}
        indexPatternId={'testId'}
        onChange={onChangeMock}
        data-test-subj={'testId'}
        savedObjectsClient={savedObjectsClient}
        indexPatternFilter={filterFn}
      />
    ).instance();

    const call = compInstance.debouncedFetch('');
    jest.advanceTimersByTime(10000);
    await call;
    await compInstance.debouncedFetch.flush();

    expect(filterFn).toHaveBeenCalledTimes(3);
    expect(compInstance.state.options).toHaveLength(2);
    expect(compInstance.state.options).toEqual([
      { label: 'pattern1', value: '1' },
      { label: 'pattern3', value: '3' },
    ]);
  });

  it('should filter index patterns by data source reference when indexPatternFilter is provided', async () => {
    jest.spyOn(savedObjectsClient, 'find').mockReturnValue(
      // @ts-ignore
      Promise.resolve({
        total: 3,
        perPage: 10,
        page: 1,
        savedObjects: [
          {
            id: '1',
            type: 'index-pattern',
            attributes: { title: 'pattern1' },
            references: [{ id: 'ds1', type: 'data-source' }],
          },
          {
            id: '2',
            type: 'index-pattern',
            attributes: { title: 'pattern2' },
            references: [{ id: 'ds2', type: 'data-source' }],
          },
          {
            id: '3',
            type: 'index-pattern',
            attributes: { title: 'pattern3' },
            references: [],
          },
        ],
      })
    );

    jest.spyOn(savedObjectsClient, 'bulkGet').mockReturnValue(
      // @ts-ignore
      Promise.resolve({
        savedObjects: [
          {
            id: 'ds1',
            type: 'data-source',
            attributes: { title: 'DataSource1' },
          },
          {
            id: 'ds2',
            type: 'data-source',
            attributes: { title: 'DataSource2' },
          },
        ],
      })
    );

    const filterFn = jest.fn((indexPattern) => {
      const dataSourceRef = indexPattern.references?.find((ref: any) => ref.type === 'data-source');
      return !dataSourceRef || dataSourceRef.id !== 'ds2';
    });

    const compInstance = shallow<IndexPatternSelect>(
      <IndexPatternSelect
        placeholder={'test index pattern'}
        indexPatternId={'testId'}
        onChange={onChangeMock}
        data-test-subj={'testId'}
        savedObjectsClient={savedObjectsClient}
        indexPatternFilter={filterFn}
      />
    ).instance();

    const call = compInstance.debouncedFetch('');
    jest.advanceTimersByTime(10000);
    await call;
    await compInstance.debouncedFetch.flush();

    expect(filterFn).toHaveBeenCalledTimes(3);
    expect(compInstance.state.options).toHaveLength(2);
    expect(compInstance.state.options).toEqual([
      { label: 'DataSource1::pattern1', value: '1' },
      { label: 'pattern3', value: '3' },
    ]);
  });
});
