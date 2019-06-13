import { mount } from 'enzyme';
import * as React from 'react';
import { ChartStore } from '../state/chart_state';
import { SpecsSpecRootComponent } from './specs_parser';

describe('Specs parser', () => {
  test('Mount and parse specs', () => {
    const chartStore = new ChartStore();
    expect(chartStore.specsInitialized.get()).toBe(false);
    const component = <SpecsSpecRootComponent chartStore={chartStore} />;
    mount(component);
    expect(chartStore.specsInitialized.get()).toBe(true);
  });
  test('chart store initialized and computeChart on component update', () => {
    const chartStore = new ChartStore();
    const computeChart = jest.fn(
      (): void => {
        return;
      },
    );
    chartStore.computeChart = computeChart;

    const component = mount(<SpecsSpecRootComponent chartStore={chartStore} />);
    component.update();
    component.setState({ foo: 'bar' });
    expect(chartStore.specsInitialized.get()).toBe(true);
    expect(computeChart).toBeCalled();
  });
  test('updates initialization state on unmount', () => {
    const chartStore = new ChartStore();
    chartStore.initialized.set(true);
    const component = mount(<SpecsSpecRootComponent chartStore={chartStore} />);
    component.unmount();
    expect(chartStore.initialized.get()).toBe(false);
  });
});
