/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { shallow } from 'enzyme';
import { SavedObjectsClientContract } from '../../../../../core/public';
import React from 'react';
import IndexPatternSelect from './index_pattern_select';

describe('IndexPatternSelect', () => {
  let client: SavedObjectsClientContract;
  const bulkGetMock = jest.fn();

  const nextTick = () => new Promise((res) => process.nextTick(res));

  beforeEach(() => {
    client = {
      find: jest.fn().mockResolvedValue({
        savedObjects: [
          {
            references: [{ id: 'testDataSourceId', type: 'data-source' }],
            attributes: { title: 'testTitle1' },
          },
          {
            references: [{ id: 'testDataSourceId', type: 'data-source' }],
            attributes: { title: 'testTitle2' },
          },
        ],
      }),
      bulkGet: bulkGetMock,
      get: jest.fn().mockResolvedValue({
        references: [{ id: 'someId', type: 'data-source' }],
        attributes: { title: 'testTitle' },
      }),
    } as any;
  });

  it('should render index pattern select', async () => {
    const onChangeMock = jest.fn();
    const compInstance = shallow(
      <IndexPatternSelect
        placeholder={'test index pattern'}
        indexPatternId={'testId'}
        onChange={onChangeMock}
        data-test-subj={'testId'}
        savedObjectsClient={client}
      />
    ).instance();

    bulkGetMock.mockResolvedValue({ savedObjects: [{ attributes: { title: 'test1' } }] });
    compInstance.debouncedFetch('');
    await new Promise((resolve) => setTimeout(resolve, 300));
    await nextTick();
    expect(bulkGetMock).toBeCalledWith([{ id: 'testDataSourceId', type: 'data-source' }]);
  });
});
