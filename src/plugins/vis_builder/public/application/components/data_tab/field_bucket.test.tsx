/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { IndexPatternField } from '../../../../../data/common';
// @ts-ignore
import { findTestSubject } from '@elastic/eui/lib/test';
import { FieldBucket } from './field_bucket';
import { Bucket } from './types';

const mockUseIndexPatterns = jest.fn(() => ({ selected: 'mockIndexPattern' }));
const mockUseOnAddFilter = jest.fn();
jest.mock('../../utils/use', () => ({
  useIndexPatterns: jest.fn(() => mockUseIndexPatterns),
  useOnAddFilter: jest.fn(() => mockUseOnAddFilter),
}));

describe('visBuilder field bucket', function () {
  function mountComponent(field: IndexPatternField, bucket: Bucket) {
    const compProps = { field, bucket };
    return mountWithIntl(<FieldBucket {...compProps} />);
  }

  it('should render with buttons if field is filterable', async () => {
    const field = new IndexPatternField(
      {
        name: 'bytes',
        type: 'number',
        esTypes: ['long'],
        count: 10,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
      },
      'bytes'
    );
    const bucket = {
      display: `display`,
      value: `value`,
      percent: 25,
      count: 100,
    };
    const comp = mountComponent(field, bucket);
    const addButton = findTestSubject(comp, 'plus-bytes-value');
    const minusButton = findTestSubject(comp, 'minus-bytes-value');
    expect(addButton.length).toBe(1);
    expect(minusButton.length).toBe(1);

    addButton.simulate('click');
    minusButton.simulate('click');
    expect(mockUseOnAddFilter).toHaveBeenCalledTimes(2);
  });
});
