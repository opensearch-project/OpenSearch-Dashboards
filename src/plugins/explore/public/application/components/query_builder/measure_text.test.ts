/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// The module caches the canvas 2d context in a closure on first use, so each
// test re-imports it fresh (jest.resetModules) with a controlled getContext.

describe('measure_text — with a working 2d canvas context', () => {
  // Fake context whose measured width is proportional to the text length so
  // assertions are deterministic regardless of the (absent) jsdom font engine.
  const makeCtx = () => {
    const ctx: any = {
      font: '',
      measureText: (t: string) => ({ width: t.length * 10 }),
    };
    return ctx;
  };

  let getContextSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => makeCtx());
  });

  afterEach(() => {
    getContextSpy.mockRestore();
  });

  it('inputWidth uses defaults (padding 16, min 50, max 200)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { inputWidth } = require('./measure_text');
    // 3 chars * 10 = 30 + 16 = 46 -> below min 50 -> 50
    expect(inputWidth('abc')).toBe(50);
    // 6 chars * 10 = 60 + 16 = 76
    expect(inputWidth('abcdef')).toBe(76);
    // long -> clamp to 200
    expect(inputWidth('x'.repeat(100))).toBe(200);
  });

  it('inputWidth honors custom padding/min/max', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { inputWidth } = require('./measure_text');
    // 4 chars * 10 = 40 + padding 60 = 100
    expect(inputWidth('abcd', 60, 10, 500)).toBe(100);
    // measured 40 + padding 0 = 40 -> below custom min 90 -> 90
    expect(inputWidth('abcd', 0, 90, 500)).toBe(90);
    // above custom max 30 -> 30
    expect(inputWidth('abcd', 60, 10, 30)).toBe(30);
  });

  it('sets the font on the context before measuring', () => {
    const ctx = makeCtx();
    const measureSpy = jest.spyOn(ctx, 'measureText');
    getContextSpy.mockImplementation(() => ctx);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { inputWidth } = require('./measure_text');
    inputWidth('hello');
    expect(ctx.font).toContain('Rubik');
    expect(measureSpy).toHaveBeenCalledWith('hello');
  });
});

describe('measure_text — when getContext returns null (fallback path)', () => {
  let getContextSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => null);
  });

  afterEach(() => {
    getContextSpy.mockRestore();
  });

  it('falls back to text.length * 8 for measurement', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { inputWidth } = require('./measure_text');
    // 'abcdef' -> 6 * 8 = 48 + 16 = 64
    expect(inputWidth('abcdef')).toBe(64);
  });
});
