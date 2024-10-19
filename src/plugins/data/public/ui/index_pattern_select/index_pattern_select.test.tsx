/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { shallow } from 'enzyme';
import React from 'react';
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
});
