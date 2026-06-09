/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { mount } from 'enzyme';

import {
  applyOverride,
  clearOverride,
  InspectorEntry,
  InspectorEnv,
  MfeInspector,
  mountInspector,
  OverrideWritableStorage,
} from './inspector';
import { OVERRIDE_STORAGE_KEY } from './override_sources';

const ENTRIES: InspectorEntry[] = [
  {
    id: 'data',
    remoteEntry: 'https://cdn.example/mfe/data/h/remoteEntry.js',
    source: 'registry',
  },
  {
    id: 'inspector',
    remoteEntry: 'http://localhost:8080/mfe/inspector/h/remoteEntry.js',
    source: 'override',
  },
];

/** A simple in-memory store implementing the writable storage surface. */
function memoryStorage(initial: Record<string, string> = {}): OverrideWritableStorage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

/** An {@link InspectorEnv} backed by a fake store + a recording navigate(). */
function testEnv(
  href: string,
  storage?: OverrideWritableStorage
): { env: InspectorEnv; navigated: string[] } {
  const navigated: string[] = [];
  return {
    navigated,
    env: {
      storage,
      getHref: () => href,
      navigate: (to) => navigated.push(to),
    },
  };
}

describe('<MfeInspector />', () => {
  it('lists every MFE with its resolved source badge', () => {
    const wrapper = mount(
      <MfeInspector entries={ENTRIES} onApply={jest.fn()} onClear={jest.fn()} />
    );

    expect(wrapper.find('[data-test-subj="mfeInspector"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-subj="mfeInspectorRow-data"]').exists()).toBe(true);
    expect(wrapper.find('[data-test-subj="mfeInspectorRow-inspector"]').exists()).toBe(true);

    // The registry plugin shows a registry/CDN badge; the overridden one shows
    // an override badge.
    expect(wrapper.find('[data-test-subj="mfeInspectorSource-data"]').hostNodes().text()).toBe(
      'registry/CDN'
    );
    expect(wrapper.find('[data-test-subj="mfeInspectorSource-inspector"]').hostNodes().text()).toBe(
      'override'
    );

    wrapper.unmount();
  });

  it('seeds each input with the current resolved remoteEntry URL', () => {
    const wrapper = mount(
      <MfeInspector entries={ENTRIES} onApply={jest.fn()} onClear={jest.fn()} />
    );

    expect(wrapper.find('input[data-test-subj="mfeInspectorInput-data"]').prop('value')).toBe(
      'https://cdn.example/mfe/data/h/remoteEntry.js'
    );

    wrapper.unmount();
  });

  it('calls onApply with the EDITED url when Apply is clicked', () => {
    const onApply = jest.fn();
    const wrapper = mount(<MfeInspector entries={ENTRIES} onApply={onApply} onClear={jest.fn()} />);

    const newUrl = 'http://localhost:8080/mfe/data/h/remoteEntry.js';
    wrapper
      .find('input[data-test-subj="mfeInspectorInput-data"]')
      .simulate('change', { target: { value: newUrl } });
    wrapper.update();
    wrapper.find('button[data-test-subj="mfeInspectorApply-data"]').simulate('click');

    expect(onApply).toHaveBeenCalledWith('data', newUrl);

    wrapper.unmount();
  });

  it('shows a Reset action only for an overridden plugin and calls onClear', () => {
    const onClear = jest.fn();
    const wrapper = mount(<MfeInspector entries={ENTRIES} onApply={jest.fn()} onClear={onClear} />);

    // The registry plugin has no Reset; the overridden one does.
    expect(wrapper.find('[data-test-subj="mfeInspectorClear-data"]').exists()).toBe(false);
    expect(wrapper.find('[data-test-subj="mfeInspectorClear-inspector"]').exists()).toBe(true);

    wrapper.find('button[data-test-subj="mfeInspectorClear-inspector"]').simulate('click');
    expect(onClear).toHaveBeenCalledWith('inspector');

    wrapper.unmount();
  });
});

describe('applyOverride', () => {
  it('persists the override to localStorage and reloads with the query param set', () => {
    const storage = memoryStorage();
    const { env, navigated } = testEnv('http://localhost:5602/app/home', storage);

    applyOverride('data', 'http://localhost:8080/x/remoteEntry.js', env);

    // Persisted under the bare-key map.
    expect(JSON.parse(storage.getItem(OVERRIDE_STORAGE_KEY)!)).toEqual({
      data: 'http://localhost:8080/x/remoteEntry.js',
    });
    // Reloaded with ?mfe.data=<url> set (encoded).
    expect(navigated).toHaveLength(1);
    const url = new URL(navigated[0]);
    expect(url.searchParams.get('mfe.data')).toBe('http://localhost:8080/x/remoteEntry.js');
  });

  it('merges with existing persisted overrides rather than replacing them', () => {
    const storage = memoryStorage({
      [OVERRIDE_STORAGE_KEY]: JSON.stringify({ all: 'http://localhost:8080' }),
    });
    const { env } = testEnv('http://localhost:5602/', storage);

    applyOverride('data', 'http://localhost:8080/x/remoteEntry.js', env);

    expect(JSON.parse(storage.getItem(OVERRIDE_STORAGE_KEY)!)).toEqual({
      all: 'http://localhost:8080',
      data: 'http://localhost:8080/x/remoteEntry.js',
    });
  });

  it('tolerates a missing storage (still reloads with the query param)', () => {
    const { env, navigated } = testEnv('http://localhost:5602/', undefined);

    expect(() => applyOverride('data', 'http://localhost:8080/x.js', env)).not.toThrow();
    expect(new URL(navigated[0]).searchParams.get('mfe.data')).toBe('http://localhost:8080/x.js');
  });
});

describe('clearOverride', () => {
  it('removes the override from localStorage and the query param, then reloads', () => {
    const storage = memoryStorage({
      [OVERRIDE_STORAGE_KEY]: JSON.stringify({
        data: 'http://localhost:8080/x.js',
        inspector: 'http://localhost:8080/y.js',
      }),
    });
    const { env, navigated } = testEnv(
      'http://localhost:5602/app?mfe.data=http%3A%2F%2Flocalhost%3A8080%2Fx.js',
      storage
    );

    clearOverride('data', env);

    // `data` dropped from storage; `inspector` kept.
    expect(JSON.parse(storage.getItem(OVERRIDE_STORAGE_KEY)!)).toEqual({
      inspector: 'http://localhost:8080/y.js',
    });
    // `mfe.data` removed from the reload URL.
    expect(new URL(navigated[0]).searchParams.has('mfe.data')).toBe(false);
  });

  it('removes the storage key entirely when clearing the last override', () => {
    const storage = memoryStorage({
      [OVERRIDE_STORAGE_KEY]: JSON.stringify({ data: 'http://localhost:8080/x.js' }),
    });
    const { env } = testEnv('http://localhost:5602/', storage);

    clearOverride('data', env);

    expect(storage.getItem(OVERRIDE_STORAGE_KEY)).toBeNull();
  });
});

describe('mountInspector', () => {
  afterEach(() => {
    // Defensively clean any auto-created root between tests.
    const root = document.getElementById('osd-mfe-inspector-root');
    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }
  });

  it('renders the panel into an auto-created container and unmounts cleanly', () => {
    const unmount = mountInspector({ entries: ENTRIES, env: testEnv('http://x/').env });

    const root = document.getElementById('osd-mfe-inspector-root');
    expect(root).not.toBeNull();
    expect(root!.querySelector('[data-test-subj="mfeInspector"]')).not.toBeNull();

    unmount();
    expect(document.getElementById('osd-mfe-inspector-root')).toBeNull();
  });

  it('renders into a caller-supplied container without removing it on unmount', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const unmount = mountInspector({ entries: ENTRIES, container, env: testEnv('http://x/').env });
    expect(container.querySelector('[data-test-subj="mfeInspector"]')).not.toBeNull();

    unmount();
    // Caller owns the container, so it stays in the DOM (just emptied).
    expect(container.parentNode).toBe(document.body);
    expect(container.querySelector('[data-test-subj="mfeInspector"]')).toBeNull();

    document.body.removeChild(container);
  });
});
