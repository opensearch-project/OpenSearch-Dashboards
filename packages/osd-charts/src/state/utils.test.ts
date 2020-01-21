import { getSpecsFromStore } from './utils';
import { ChartTypes } from '../chart_types';
import { SpecTypes } from '../specs/settings';

describe('State utils', () => {
  it('getSpecsFromStore shall return always the same object reference excluding the array', () => {
    const spec1 = { id: 'id1', chartType: ChartTypes.XYAxis, specType: SpecTypes.Series };
    const specs = getSpecsFromStore({ id1: spec1 }, ChartTypes.XYAxis, SpecTypes.Series);
    expect(specs[0]).toBe(spec1);
  });
});
