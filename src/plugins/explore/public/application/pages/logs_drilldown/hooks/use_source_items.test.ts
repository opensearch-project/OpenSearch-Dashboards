/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useSourceItems } from './use_source_items';

const page = (ids: string[], nextToken?: string) => ({
  items: ids.map((id) => ({ id, name: id })),
  nextToken,
});

const makeDrilldown = () =>
  ({
    ScopeSelector: () => null,
    listItems: jest.fn(),
    fetchPreview: jest.fn(),
    toDataset: jest.fn(),
  }) as any;

describe('useSourceItems', () => {
  it('lists nothing until there is a scope', () => {
    const drilldown = makeDrilldown();
    const { result } = renderHook(() => useSourceItems(drilldown, undefined, ''));
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(drilldown.listItems).not.toHaveBeenCalled();
  });

  it('lists the first page, then the next with its token, without repeats', async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems
      .mockResolvedValueOnce(page(['a', 'b'], 't2'))
      .mockResolvedValueOnce(page(['b', 'c']));
    const { result } = renderHook(() => useSourceItems(drilldown, { region: 'r' }, 'x'));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(drilldown.listItems).toHaveBeenCalledWith(
      expect.objectContaining({ scope: { region: 'r' }, search: 'x' })
    );
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(['a', 'b', 'c']));
    expect(drilldown.listItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ nextToken: 't2' })
    );
    expect(result.current.nextToken).toBeUndefined();
  });

  it('drops the answer for an older scope', async () => {
    const drilldown = makeDrilldown();
    let answerOld: (value: unknown) => void = () => {};
    drilldown.listItems
      .mockReturnValueOnce(new Promise((resolve) => (answerOld = resolve)))
      .mockResolvedValueOnce(page(['new']));
    const { result, rerender } = renderHook(({ scope }) => useSourceItems(drilldown, scope, ''), {
      initialProps: { scope: { region: 'old' } as Record<string, unknown> },
    });
    rerender({ scope: { region: 'new' } });
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(['new']));
    await act(async () => answerOld(page(['stale'])));
    expect(result.current.items.map((i) => i.id)).toEqual(['new']);
  });

  it('does not list again for a new scope object with the same content', async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems.mockResolvedValue(page(['a']));
    const { rerender } = renderHook(({ scope }) => useSourceItems(drilldown, scope, ''), {
      initialProps: { scope: { region: 'r' } as Record<string, unknown> },
    });
    await waitFor(() => expect(drilldown.listItems).toHaveBeenCalledTimes(1));
    rerender({ scope: { region: 'r' } });
    expect(drilldown.listItems).toHaveBeenCalledTimes(1);
  });

  it('keeps the raw rejection, which call failed, and lists again on retry', async () => {
    const drilldown = makeDrilldown();
    const rejection = Object.assign(new Error('Forbidden'), { statusCode: 403 });
    drilldown.listItems.mockRejectedValueOnce(rejection).mockResolvedValueOnce(page(['a']));
    const { result } = renderHook(() => useSourceItems(drilldown, { region: 'r' }, ''));
    await waitFor(() => expect(result.current.error).toBe('Forbidden'));
    expect(result.current.errorCause).toBe(rejection);
    expect(result.current.errorFrom).toBe('list');
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.error).toBeUndefined();
  });

  it('asks for a page size, keeps at most that many of a longer page, and stops at the cap', async () => {
    const drilldown = makeDrilldown();
    const many = (from: number, n: number) => Array.from({ length: n }, (_, i) => `i${from + i}`);
    drilldown.listItems.mockResolvedValueOnce(page(many(0, 80), 't2'));
    const { result } = renderHook(() => useSourceItems(drilldown, { region: 'r' }, ''));
    await waitFor(() => expect(result.current.items).toHaveLength(50));
    expect(drilldown.listItems).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 50 }));
    // 19 more pages of 50 reach the 1000 cap; "Load more" then stops.
    for (let i = 1; i < 20; i++) {
      drilldown.listItems.mockResolvedValueOnce(page(many(i * 50, 50), `t${i + 2}`));
      act(() => result.current.loadMore());
      await waitFor(() => expect(result.current.items).toHaveLength((i + 1) * 50));
    }
    expect(result.current.capped).toBe(true);
    expect(result.current.nextToken).toBeUndefined();
  });

  it('drops a "Load more" answer that arrives after a refresh started', async () => {
    const drilldown = makeDrilldown();
    let answerMore: (value: unknown) => void = () => {};
    let answerRefresh: (value: unknown) => void = () => {};
    drilldown.listItems
      .mockResolvedValueOnce(page(['a'], 'old-t2'))
      .mockReturnValueOnce(new Promise((resolve) => (answerMore = resolve)))
      .mockReturnValueOnce(new Promise((resolve) => (answerRefresh = resolve)));
    const { result, rerender } = renderHook(
      ({ refresh }) => useSourceItems(drilldown, { region: 'r' }, '', refresh),
      { initialProps: { refresh: 0 } }
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.loadMore());
    rerender({ refresh: 1 });
    // The refresh drops the old listing's "Load more".
    expect(result.current.nextToken).toBeUndefined();
    await act(async () => answerRefresh(page(['n1'], 'new-t2')));
    await act(async () => answerMore(page(['old-page-2'], 'old-t3')));
    expect(result.current.items.map((i) => i.id)).toEqual(['n1']);
    expect(result.current.nextToken).toBe('new-t2');
  });

  it("turns a source's synchronous throw into a listing error", async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems.mockImplementation(() => {
      throw new Error('bad scope');
    });
    const { result } = renderHook(() => useSourceItems(drilldown, { region: 'r' }, ''));
    await waitFor(() => expect(result.current.error).toBe('bad scope'));
  });

  it('lists a scope once whatever its key order', async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems.mockResolvedValue(page(['a']));
    const { rerender } = renderHook(({ scope }) => useSourceItems(drilldown, scope, ''), {
      initialProps: { scope: { region: 'r', accountId: 'x' } as Record<string, unknown> },
    });
    await waitFor(() => expect(drilldown.listItems).toHaveBeenCalledTimes(1));
    rerender({ scope: { accountId: 'x', region: 'r' } });
    expect(drilldown.listItems).toHaveBeenCalledTimes(1);
  });

  it('marks a failed "Load more" as such and keeps the list', async () => {
    const drilldown = makeDrilldown();
    drilldown.listItems
      .mockResolvedValueOnce(page(['a'], 't2'))
      .mockRejectedValueOnce(new Error('throttled'));
    const { result } = renderHook(() => useSourceItems(drilldown, { region: 'r' }, ''));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.errorFrom).toBe('more'));
    expect(result.current.items).toHaveLength(1);
  });
});
