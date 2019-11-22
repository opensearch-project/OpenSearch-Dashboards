import { Chart } from '../components/chart';

describe('test getPNGSnapshot in Chart class', () => {
  jest.mock('../components/chart');
  it('should be called', () => {
    const chart = new Chart({});
    const spy = jest.spyOn(chart, 'getPNGSnapshot');
    chart.getPNGSnapshot({ backgroundColor: 'white', pixelRatio: 1 });

    expect(spy).toBeCalled();
  });
});
