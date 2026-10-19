/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EMPTY_HISTORY,
  FlyoutView,
  currentView,
  backHistory,
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
    expect(navigationTargets(h)).toEqual({ back: undefined });
  });

  it('goes back and forgets the flyout left, and stops at the start', () => {
    let h = pushHistory(resetHistory(session('s1')), trace('t1'));
    expect(navigationTargets(h)).toEqual({ back: { kind: 'session', label: 's1' } });
    h = backHistory(h);
    expect(currentView(h)).toEqual(session('s1'));
    expect(h.entries).toHaveLength(1);
    expect(navigationTargets(h)).toEqual({ back: undefined });
    expect(backHistory(h)).toBe(h);
  });

  it('records state on the flyout left', () => {
    const h = pushHistory(
      resetHistory(session('s1')),
      trace('t2'),
      (current) => ({ ...current, focusTraceId: 'id-t2' }) as FlyoutView
    );
    expect(h.entries).toHaveLength(2);
    expect(h.entries[0]).toEqual({ ...session('s1'), focusTraceId: 'id-t2' });
    expect(currentView(h)).toEqual(trace('t2'));
  });
});
