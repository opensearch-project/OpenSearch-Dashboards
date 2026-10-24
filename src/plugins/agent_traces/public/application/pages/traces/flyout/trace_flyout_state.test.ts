/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EMPTY_HISTORY,
  FlyoutView,
  currentView,
  moveHistory,
  navigationTargets,
  pushHistory,
  resetHistory,
} from './trace_flyout_state';

const session = (sessionId: string): FlyoutView => ({ kind: 'session', sessionId });
const trace = (name: string): FlyoutView => ({
  kind: 'trace',
  trace: { name, traceId: `id-${name}` } as never,
});

describe('flyout history', () => {
  it('starts empty and resets to one entry', () => {
    expect(currentView(EMPTY_HISTORY)).toBeNull();
    const h = resetHistory(session('s1'));
    expect(currentView(h)).toEqual(session('s1'));
    expect(navigationTargets(h)).toEqual({ back: undefined, forward: undefined });
  });

  it('moves back and forward along the path, and stops at the ends', () => {
    let h = pushHistory(resetHistory(session('s1')), trace('t1'));
    expect(navigationTargets(h)).toEqual({
      back: { kind: 'session', label: 's1' },
      forward: undefined,
    });
    h = moveHistory(h, -1);
    expect(currentView(h)).toEqual(session('s1'));
    expect(navigationTargets(h).forward).toEqual({ kind: 'trace', label: 't1' });
    expect(moveHistory(h, -1)).toBe(h);
    h = moveHistory(h, 1);
    expect(currentView(h)).toEqual(trace('t1'));
    expect(moveHistory(h, 1)).toBe(h);
  });

  it('drops forward entries on a new move and records state on the flyout left', () => {
    let h = pushHistory(resetHistory(session('s1')), trace('t1'));
    h = moveHistory(h, -1);
    h = pushHistory(
      h,
      trace('t2'),
      (current) => ({ ...current, focusTraceId: 'id-t2' }) as FlyoutView
    );
    expect(h.entries).toHaveLength(2);
    expect(h.entries[0]).toEqual({ ...session('s1'), focusTraceId: 'id-t2' });
    expect(currentView(h)).toEqual(trace('t2'));
  });
});
