/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
// @ts-expect-error TS2305 TODO(ts-error): fixme
import { IDataset } from '../../../../../../data/public';
import { getFieldFormat } from './get_field_format';

const dataset = ({
  fieldFormatMap: {
    Elastic: {
      type: {
        title: 'string',
      },
    },
  },
} as unknown) as IDataset;

describe('getFieldFormat', () => {
  test('should handle no arguments', () => {
    expect(getFieldFormat()).toEqual('');
  });

  test('should handle no field name', () => {
    expect(getFieldFormat(dataset)).toEqual('');
  });

  test('should handle empty name', () => {
    expect(getFieldFormat(dataset, '')).toEqual('');
  });

  test('should handle undefined field name', () => {
    expect(getFieldFormat(dataset, 'none')).toEqual(undefined);
  });

  test('should retrieve field format', () => {
    expect(getFieldFormat(dataset, 'Elastic')).toEqual('string');
  });
});
