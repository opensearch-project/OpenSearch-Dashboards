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
 * under the License.
 */

import numeral from 'numeral';

import { LogBase } from '../../packages/charts/src/scales/scale_continuous';

const superStringMap: Record<string, string> = {
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
};

export const getSuperScriptNumber = (n: number) =>
  `${n >= 0 ? '' : '⁻'}${Math.abs(n)
    .toString()
    .split('')
    .map((c) => superStringMap[c])
    .join('')}`;

export const logBaseMap = {
  [LogBase.Common]: 10,
  [LogBase.Binary]: 2,
  [LogBase.Natural]: Math.E,
};

export const logFormatter = (base: LogBase = LogBase.Common) => (n: number): string => {
  if (n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const nAbs = Math.abs(n);
  const exp = Math.log(nAbs) / Math.log(logBaseMap[base]) + Number.EPSILON;
  const roundedExp = Math.floor(exp);
  const constant = numeral(nAbs / Math.pow(logBaseMap[base], roundedExp)).format('0[.]00');
  const baseLabel = base === LogBase.Natural ? 'e' : logBaseMap[base];
  const expString = getSuperScriptNumber(roundedExp);
  return `${sign}${constant} x ${baseLabel}${expString}`;
};
