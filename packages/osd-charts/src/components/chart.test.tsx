/**
 * @jest-environment node
 */
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
        <Settings debug={true} rendering={'svg'} />
      </Chart>,
    );
    expect(wrapper.text()).toContain('No data to display');
  });
});
