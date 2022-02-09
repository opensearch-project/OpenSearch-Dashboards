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

import { mount } from 'enzyme';
import React from 'react';

import { Settings, BarSeries } from '../specs';
import { Chart } from './chart';

describe('Chart', () => {
  it("should render 'No data to display' without series", () => {
    const wrapper = mount(<Chart />);
    expect(wrapper.text()).toContain('No data to display');
  });

  it("should render 'No data to display' with settings but without series", () => {
    const wrapper = mount(
      <Chart>
        <Settings debug rendering="svg" />
      </Chart>,
    );
    expect(wrapper.text()).toContain('No data to display');
  });

  it("should render 'No data to display' with an empty dataset", () => {
    const wrapper = mount(
      <Chart size={[100, 100]}>
        <Settings debug rendering="svg" />
        <BarSeries id="test" data={[]} />
      </Chart>,
    );
    expect(wrapper.text()).toContain('No data to display');
  });

  it('should render the legend name test', () => {
    const wrapper = mount(
      <Chart size={[100, 100]} id="chart1">
        <Settings debug rendering="svg" showLegend />
        <BarSeries id="test" data={[{ x: 0, y: 2 }]} />
      </Chart>,
    );
    expect(wrapper.debug()).toMatchSnapshot();
  });
});
