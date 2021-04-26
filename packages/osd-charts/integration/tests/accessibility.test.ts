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

import { common } from '../page_objects/common';

describe('Accessibility tree', () => {
  it.skip('should include the series types if one type of series', async () => {
    const tree = await common.testAccessibilityTree(
      'http://localhost:9001/iframe.html?id=annotations-lines--x-continuous-domain',
      '.echCanvasRenderer',
    );
    // the legend has bars and lines as value.descriptions not value.name
    const hasTextOfChartTypes = tree.children.filter((value) => {
      return value.name === 'bar chart';
    });
    expect(hasTextOfChartTypes[0].name).toBe('bar chart');
  });
  it('should include the series types if multiple types of series', async () => {
    const tree = await common.testAccessibilityTree(
      'http://localhost:9001/iframe.html?id=mixed-charts--bars-and-lines',
      '.echCanvasRenderer',
    );
    // the legend has bars and lines as value.descriptions not value.name
    const hasTextOfChartTypes = tree.children.filter((value) => {
      return value.name === 'Mixed chart: bar and line chart';
    });
    expect(hasTextOfChartTypes[0].name).toBe('Mixed chart: bar and line chart');
  });
});
