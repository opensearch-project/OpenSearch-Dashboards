import { none } from 'fp-ts/lib/Option';
import { CanvasTextBBoxCalculator } from './canvas_text_bbox_calculator';

describe('CanvasTextBBoxCalculator', () => {
  test('can create a canvas for computing text measurement values', () => {
    const canvasBboxCalculator = new CanvasTextBBoxCalculator();
    const bbox = canvasBboxCalculator.compute('foo').getOrElse({
      width: 0,
      height: 0,
    });

    const expectedDims = {
      width: 10.6,
      height: 16,
    };

    expect(bbox).toEqual(expectedDims);

    canvasBboxCalculator.context = null;
    expect(canvasBboxCalculator.compute('foo')).toBe(none);
  });
});
