/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { TickFormatter, TickFormatterOptions } from '../../chart_types/xy_chart/utils/specs';
import { getMomentWithTz } from './date_time';
import moment from 'moment-timezone';

export function timeFormatter(format: string): TickFormatter {
  return (value: number, options?: TickFormatterOptions): string => {
    return getMomentWithTz(value, options && options.timeZone).format(format);
  };
}

export function niceTimeFormatter(domain: [number, number]): TickFormatter {
  const minDate = moment(domain[0]);
  const maxDate = moment(domain[1]);
  const diff = maxDate.diff(minDate, 'days');
  const format = niceTimeFormatByDay(diff);
  return timeFormatter(format);
}

export function niceTimeFormatByDay(days: number) {
  if (days > 30) {
    return 'YYYY-MM-DD';
  }
  if (days > 7 && days <= 30) {
    return 'MMMM DD';
  }
  if (days > 1 && days <= 7) {
    return 'MM-DD HH:mm';
  }
  return 'HH:mm:ss';
}
