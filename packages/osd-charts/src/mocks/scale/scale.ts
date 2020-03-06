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

import { mergePartial } from '../../utils/commons';
import { Scale, ScaleType } from '../../scales';

export class MockScale {
  private static readonly base: Scale = {
    scale: jest.fn().mockImplementation((x) => x),
    type: ScaleType.Linear,
    bandwidth: 0,
    bandwidthPadding: 0,
    minInterval: 0,
    barsPadding: 0,
    range: [0, 100],
    domain: [0, 100],
    ticks: jest.fn(),
    pureScale: jest.fn(),
    invert: jest.fn(),
    invertWithStep: jest.fn(),
    isSingleValue: jest.fn(),
    isValueInDomain: jest.fn(),
    isInverted: false,
  };

  static default(partial: Partial<Scale>): Scale {
    return mergePartial<Scale>(MockScale.base, partial);
  }
}
