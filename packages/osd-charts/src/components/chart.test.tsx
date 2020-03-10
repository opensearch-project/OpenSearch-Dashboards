/**
 * @jest-environment node
 */
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
// Using node env because JSDOM environment throws warnings:
// Jest doesn't work well with the environment detection hack that react-redux uses internally.
// https://github.com/reduxjs/react-redux/issues/1373

import React from 'react';
import { Chart } from './chart';
import { render } from 'enzyme';
import { Settings } from '../specs';

describe('Chart', () => {
  it("should render 'No data to display' without series", () => {
    const wrapper = render(<Chart />);
    expect(wrapper.text()).toContain('No data to display');
  });

  it("should render 'No data to display' with settings but without series", () => {
    const wrapper = render(
      <Chart>
        <Settings debug={true} rendering="svg" />
      </Chart>,
    );
    expect(wrapper.text()).toContain('No data to display');
  });
});
