/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CSVTestCaseFormat {
  rawStringArray: string[];
  expected: Array<Record<any, any>>;
  delimiter: string;
}

export const VALID_CSV_CASES: CSVTestCaseFormat[] = [
  {
    rawStringArray: ['field1,field2,field3\n', '1,242,55322241\n', '445,114,9009\n', '11,142,0'],
    expected: [
      { field1: '1', field2: '242', field3: '55322241' },
      { field1: '445', field2: '114', field3: '9009' },
      { field1: '11', field2: '142', field3: '0' },
    ],
    delimiter: ',',
  },
  {
    rawStringArray: [
      'field1,field2,field3,field4\n',
      '1,242,55322241\n',
      '445,114,9009,-1\n',
      '11',
    ],
    expected: [
      { field1: '1', field2: '242', field3: '55322241', field4: '' },
      { field1: '445', field2: '114', field3: '9009', field4: '-1' },
      { field1: '11', field2: '', field3: '', field4: '' },
    ],
    delimiter: ',',
  },
  {
    rawStringArray: ['field1,field2,\n'],
    expected: [],
    delimiter: ',',
  },
  {
    rawStringArray: [],
    expected: [],
    delimiter: ';',
  },
  {
    rawStringArray: ['f1;f2\n', 'foo;bar\n', 'aa;'],
    expected: [
      {
        f1: 'foo',
        f2: 'bar',
      },
      {
        f1: 'aa',
        f2: '',
      },
    ],
    delimiter: ';',
  },
  {
    rawStringArray: [
      'email,name,age,gender,occupation,phone\n',
      'john@example.com,John Smith,44,male,engineer,0\n',
      'mary@example.com,Mary Shelby,31,,VP sales,',
    ],
    expected: [
      {
        email: 'john@example.com',
        name: 'John Smith',
        age: '44',
        gender: 'male',
        occupation: 'engineer',
        phone: '0',
      },
      {
        email: 'mary@example.com',
        name: 'Mary Shelby',
        age: '31',
        gender: '',
        occupation: 'VP sales',
        phone: '',
      },
    ],
    delimiter: ',',
  },
];

export const INVALID_CSV_CASES: CSVTestCaseFormat[] = [
  {
    rawStringArray: ['field1,field2,field3\n', '\n', '00,141,4224,333\n', '4552,993,221'],
    delimiter: ',',
    expected: [],
  },
  {
    rawStringArray: ['field1,field2,,field4\n', '0019,224,545,211\n', '1959,2485,2525'],
    delimiter: ',',
    expected: [],
  },
];
