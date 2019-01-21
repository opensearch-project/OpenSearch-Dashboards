import { ScaleType } from '../utils/scales/scales';
import { XDomain } from './domains/x_domain';
import { computeXScale } from './scales';

describe('Series scales', () => {
  test('X Scale linear min, max with bands', () => {
    const xDomain: XDomain = {
      type: 'xDomain',
      isBandScale: true,
      domain: [0, 3],
      minInterval: 1,
      scaleType: ScaleType.Linear,
    };
    const scale = computeXScale(xDomain, 1, 0, 120);
    const expectedBandwidth = 120 / 4;
    expect(scale.bandwidth).toBe(expectedBandwidth);
    expect(scale.scale(0)).toBe(expectedBandwidth * 0);
    expect(scale.scale(1)).toBe(expectedBandwidth * 1);
    expect(scale.scale(2)).toBe(expectedBandwidth * 2);
    expect(scale.scale(3)).toBe(expectedBandwidth * 3);
  });
  test('X Scale linear inverse min, max with bands', () => {
    const xDomain: XDomain = {
      type: 'xDomain',
      isBandScale: true,
      domain: [0, 3],
      minInterval: 1,
      scaleType: ScaleType.Linear,
    };
    const scale = computeXScale(xDomain, 1, 120, 0);
    const expectedBandwidth = 120 / 4;
    expect(scale.bandwidth).toBe(expectedBandwidth);
    expect(scale.scale(0)).toBe(expectedBandwidth * 3);
    expect(scale.scale(1)).toBe(expectedBandwidth * 2);
    expect(scale.scale(2)).toBe(expectedBandwidth * 1);
    expect(scale.scale(3)).toBe(expectedBandwidth * 0);
  });
});
