/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDataSourcePickerHandler } from './create_data_source_change_handler';

describe('createDataSourcePickerHandler()', () => {
  let handleChange: jest.Mock<any, any>;
  let changeHandler: (selectedOptions: []) => void;

  beforeEach(() => {
    handleChange = jest.fn();
    changeHandler = createDataSourcePickerHandler(handleChange);
  });

  test.each([
    {
      id: undefined,
    },
    {},
  ])(
    'calls handleChange() and sets data_source_id to undefined if id cannot be found or is undefined',
    ({ id }) => {
      // @ts-ignore
      changeHandler([{ id }]);
      expect(handleChange.mock.calls.length).toEqual(1);
      expect(handleChange.mock.calls[0][0]).toEqual({
        data_source_id: undefined,
      });
    }
  );

  test.each([
    {
      id: '',
    },
    {
      id: 'foo',
    },
  ])('calls handleChange() function with partial and updates the data_source_id', ({ id }) => {
    // @ts-ignore
    changeHandler([{ id }]);
    expect(handleChange.mock.calls.length).toEqual(1);
    expect(handleChange.mock.calls[0][0]).toEqual({
      data_source_id: id,
    });
  });
});
