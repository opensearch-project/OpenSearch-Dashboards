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
