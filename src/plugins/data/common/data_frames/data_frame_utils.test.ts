/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimeRange } from '../types';
import { formatTimePickerDate } from './utils';

describe('Data Frame Utils', () => {
  describe('formatTimePickerDate function', () => {
    Date.now = jest.fn(() => new Date('2024-05-04T12:30:00.000Z'));

    test('should return a correctly formatted date', () => {
      const range = { from: 'now-15m', to: 'now' } as TimeRange;
      const formattedDate = formatTimePickerDate(range, 'YYYY-MM-DD HH:mm:ss.SSS');
      expect(formattedDate).toStrictEqual({
        fromDate: '2024-05-04 12:15:00.000',
        toDate: '2024-05-04 12:30:00.000',
      });
    });

    test('should indicate invalid when given bad dates', () => {
      const range = { from: 'fake', to: 'date' } as TimeRange;
      const formattedDate = formatTimePickerDate(range, 'YYYY-MM-DD HH:mm:ss.SSS');
      expect(formattedDate).toStrictEqual({
        fromDate: 'Invalid date',
        toDate: 'Invalid date',
      });
    });
  });
});
