/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConversationDataSourceStore } from './conversation_data_source_store';

describe('ConversationDataSourceStore', () => {
  const STORAGE_KEY = 'chat.conversationDataSourceState';
  let store: ConversationDataSourceStore;

  beforeEach(() => {
    localStorage.clear();
    store = new ConversationDataSourceStore();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should round-trip session list and confirmed id for a thread', () => {
    store.set('thread-1', {
      sessionDataSourceList: ['ds-a', 'ds-b'],
      confirmedDataSourceId: 'ds-b',
    });

    expect(store.get('thread-1')).toEqual({
      sessionDataSourceList: ['ds-a', 'ds-b'],
      confirmedDataSourceId: 'ds-b',
    });
  });

  it('should keep separate state per thread', () => {
    store.set('thread-1', { sessionDataSourceList: ['ds-a'], confirmedDataSourceId: 'ds-a' });
    store.set('thread-2', { sessionDataSourceList: ['ds-b'], confirmedDataSourceId: 'ds-b' });

    expect(store.get('thread-1')?.confirmedDataSourceId).toBe('ds-a');
    expect(store.get('thread-2')?.confirmedDataSourceId).toBe('ds-b');
  });

  it('should overwrite existing state for the same thread', () => {
    store.set('thread-1', { sessionDataSourceList: ['ds-a'], confirmedDataSourceId: 'ds-a' });
    store.set('thread-1', {
      sessionDataSourceList: ['ds-a', 'ds-b'],
      confirmedDataSourceId: 'ds-b',
    });

    expect(store.get('thread-1')).toEqual({
      sessionDataSourceList: ['ds-a', 'ds-b'],
      confirmedDataSourceId: 'ds-b',
    });
  });

  it('should return undefined for an unknown or empty thread id', () => {
    expect(store.get('missing')).toBeUndefined();
    expect(store.get('')).toBeUndefined();
  });

  it('should not persist under an empty thread id', () => {
    store.set('', { sessionDataSourceList: ['ds-a'], confirmedDataSourceId: 'ds-a' });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should delete a thread entry', () => {
    store.set('thread-1', { sessionDataSourceList: ['ds-a'], confirmedDataSourceId: 'ds-a' });
    store.delete('thread-1');

    expect(store.get('thread-1')).toBeUndefined();
  });

  it('should evict the oldest entries beyond the cap and keep the most recent', () => {
    // maxEntries is 50; write 55 threads and confirm the first 5 are evicted.
    for (let i = 0; i < 55; i++) {
      store.set(`thread-${i}`, {
        sessionDataSourceList: [`ds-${i}`],
        confirmedDataSourceId: `ds-${i}`,
      });
    }

    expect(store.get('thread-0')).toBeUndefined();
    expect(store.get('thread-4')).toBeUndefined();
    expect(store.get('thread-5')).toBeDefined();
    expect(store.get('thread-54')?.confirmedDataSourceId).toBe('ds-54');
  });

  it('should keep a re-written thread from being evicted', () => {
    for (let i = 0; i < 50; i++) {
      store.set(`thread-${i}`, { sessionDataSourceList: [`ds-${i}`] });
    }

    // Touch the oldest thread so it becomes the most recently written.
    store.set('thread-0', { sessionDataSourceList: ['ds-0-updated'] });
    // Push one more thread past the cap; the least-recently-written (thread-1) is evicted.
    store.set('thread-50', { sessionDataSourceList: ['ds-50'] });

    expect(store.get('thread-0')?.sessionDataSourceList).toEqual(['ds-0-updated']);
    expect(store.get('thread-1')).toBeUndefined();
  });

  it('should recover gracefully from corrupt stored JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');

    expect(store.get('thread-1')).toBeUndefined();
    // A subsequent write should overwrite the corrupt value cleanly.
    store.set('thread-1', { sessionDataSourceList: ['ds-a'], confirmedDataSourceId: 'ds-a' });
    expect(store.get('thread-1')?.confirmedDataSourceId).toBe('ds-a');
  });
});
