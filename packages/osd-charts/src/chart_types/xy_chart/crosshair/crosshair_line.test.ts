import { getCursorLinePosition } from './crosshair_utils';

describe('Crosshair line position', () => {
  it('shuld not compute line position for outside pointer coordinates', () => {
    const linePos = getCursorLinePosition(0, { width: 100, height: 100, left: 0, top: 0 }, { x: -1, y: -1 });
    expect(linePos).toBeUndefined();
  });
  it('shuld compute line position for inside pointer coordinates', () => {
    const linePos = getCursorLinePosition(0, { width: 100, height: 100, left: 0, top: 0 }, { x: 50, y: 50 });
    expect(linePos).toBeDefined();
  });
});
