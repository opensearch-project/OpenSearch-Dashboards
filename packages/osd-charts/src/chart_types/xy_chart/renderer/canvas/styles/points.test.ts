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

import { getRadius } from './point';

describe('point', () => {
  describe('#getRadius', () => {
    it('should return max of point and theme radius - theme', () => {
      expect(getRadius(10, 20)).toBe(20);
    });

    it('should return max of point and theme radius - point', () => {
      expect(getRadius(30, 20)).toBe(30);
    });

    it('should return override if provided - lower', () => {
      expect(getRadius(10, 20, 5)).toBe(5);
    });

    it('should return override if provided - higher', () => {
      expect(getRadius(10, 20, 50)).toBe(50);
    });
  });
});
