import { CanvasTextBBoxCalculator } from './canvas_text_bbox_calculator';

describe('CanvasTextBBoxCalculator', () => {
  test('can create a canvas for computing text measurement values', () => {
    const canvasBboxCalculator = new CanvasTextBBoxCalculator();
    const bbox = canvasBboxCalculator.compute('foo', 0);
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);
  });
});
