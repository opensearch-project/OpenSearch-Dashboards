import { none } from 'fp-ts/lib/Option';
import { CanvasTextBBoxCalculator } from './canvas_text_bbox_calculator';

describe('CanvasTextBBoxCalculator', () => {
  test('can create a canvas for computing text measurement values', () => {
    const canvasBboxCalculator = new CanvasTextBBoxCalculator();
    const bbox = canvasBboxCalculator.compute('foo').getOrElse({
      width: 0,
      height: 0,
    });
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);

    canvasBboxCalculator.context = null;
    expect(canvasBboxCalculator.compute('foo')).toBe(none);
  });
  test('can compute near the same width for the same text independently of the scale factor', () => {
    let canvasBboxCalculator = new CanvasTextBBoxCalculator(undefined, 5);

    let bbox = canvasBboxCalculator.compute('foo').getOrElse({
      width: 0,
      height: 0,
    });
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);

    canvasBboxCalculator = new CanvasTextBBoxCalculator(undefined, 10);

    bbox = canvasBboxCalculator.compute('foo').getOrElse({
      width: 0,
      height: 0,
    });
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);

    canvasBboxCalculator = new CanvasTextBBoxCalculator(undefined, 50);

    bbox = canvasBboxCalculator.compute('foo').getOrElse({
      width: 0,
      height: 0,
    });
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);

    canvasBboxCalculator = new CanvasTextBBoxCalculator(undefined, 100);

    bbox = canvasBboxCalculator.compute('foo').getOrElse({
      width: 0,
      height: 0,
    });
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);

    canvasBboxCalculator = new CanvasTextBBoxCalculator(undefined, 1000);

    bbox = canvasBboxCalculator.compute('foo').getOrElse({
      width: 0,
      height: 0,
    });
    expect(Math.abs(bbox.width - 23.2)).toBeLessThanOrEqual(2);
    expect(bbox.height).toBe(16);
  });
});
