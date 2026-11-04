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
  openSessionFromTrace,
  openTraceFromSession,
  previousView,
  pushHistory,
  resetHistory,
  SessionView,
  TraceView,
} from './trace_flyout_state';

const session = (sessionId: string): FlyoutView => ({ kind: 'session', sessionId });
const trace = (name: string): FlyoutView => ({
  kind: 'trace',
  trace: { name, traceId: `id-${name}` } as never,
});
/** One agent run (span) of a trace. */
const run = (traceId: string, spanId: string, loaded = false): TraceView => ({
  kind: 'trace',
  trace: { name: spanId, traceId, spanId } as never,
  ...(loaded ? { fullTree: [] } : {}),
});
const sessionView = (sessionId: string): SessionView => ({ kind: 'session', sessionId });

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

  it('goes back one flyout at a time from deeper in', () => {
    const h = pushHistory(pushHistory(resetHistory(trace('t1')), session('s1')), trace('t2'));
    expect(previousView(h)).toEqual(session('s1'));
    const back = backHistory(h);
    expect(back.entries).toEqual([trace('t1'), session('s1')]);
    expect(previousView(back)).toEqual(trace('t1'));
    expect(previousView(resetHistory(trace('t1')))).toBeUndefined();
  });
});

describe('moving between a trace and its session', () => {
  it('records the agent run opened and the session view on the session', () => {
    const h = openTraceFromSession(resetHistory(sessionView('s1')), run('t', 'agent-2'), {
      view: 'all',
      drillTab: 'spans',
    });
    expect(h.entries[0]).toEqual({
      ...sessionView('s1'),
      focusTraceId: 't',
      focusSpanId: 'agent-2',
      sessionView: { view: 'all', drillTab: 'spans' },
    });
    expect(currentView(h)).toEqual(run('t', 'agent-2'));
  });

  it('goes back to the run a session came from; another run of the trace is a drill-down', () => {
    const start = openSessionFromTrace(resetHistory(run('t', 'agent-1', true)), sessionView('s1'));
    expect(start.entries[1]).toEqual({
      ...sessionView('s1'),
      focusTraceId: 't',
      focusSpanId: 'agent-1',
    });

    const same = openTraceFromSession(start, run('t', 'agent-1'));
    expect(same.entries).toEqual([run('t', 'agent-1', true)]);

    const other = openTraceFromSession(start, run('t', 'agent-2'));
    expect(other.entries).toEqual([
      run('t', 'agent-1', true),
      { ...sessionView('s1'), focusTraceId: 't', focusSpanId: 'agent-2', sessionView: undefined },
      run('t', 'agent-2'),
    ]);
    expect(previousView(other)).toEqual(other.entries[1]);
  });

  it('goes back to the session a trace came from', () => {
    const h = openTraceFromSession(resetHistory(sessionView('s1')), run('t', 'a'));
    expect(openSessionFromTrace(h, sessionView('s1')).entries).toEqual([
      { ...sessionView('s1'), focusTraceId: 't', focusSpanId: 'a', sessionView: undefined },
    ]);
    expect(openSessionFromTrace(h, sessionView('s2')).entries).toHaveLength(3);
  });
});
