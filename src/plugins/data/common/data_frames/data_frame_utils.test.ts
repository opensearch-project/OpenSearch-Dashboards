/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { TimeRange } from '../types';
import { formatTimePickerDate } from './utils';

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

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
