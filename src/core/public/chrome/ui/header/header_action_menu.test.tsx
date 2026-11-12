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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react';
import { BehaviorSubject } from 'rxjs';
import { HeaderActionMenu } from './header_action_menu';
import { MountPoint, UnmountCallback } from '../../../types';
import { SCREEN_TITLE_ATTRIBUTE } from '../../constants';

type MockedUnmount = jest.MockedFunction<UnmountCallback>;

describe('HeaderActionMenu', () => {
  let component: ReactWrapper;
  let menuMount$: BehaviorSubject<MountPoint | undefined>;
  let unmounts: Record<string, MockedUnmount>;

  beforeEach(() => {
    menuMount$ = new BehaviorSubject<MountPoint | undefined>(undefined);
    unmounts = {};
  });

  const refresh = () => {
    new Promise(async (resolve) => {
      if (component) {
        act(() => {
          component.update();
        });
      }
      setImmediate(() => resolve(component)); // flushes any pending promises
    });
  };

  const createMountPoint =
    (id: string, content: string = id): MountPoint =>
    (root): MockedUnmount => {
      const container = document.createElement('DIV');
      // eslint-disable-next-line no-unsanitized/property
      container.innerHTML = content;
      root.appendChild(container);
      const unmount = jest.fn(() => container.remove());
      unmounts[id] = unmount;
      return unmount;
    };

  it('mounts the current value of the provided observable', async () => {
    component = mount(<HeaderActionMenu actionMenu$={menuMount$} />);

    act(() => {
      menuMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerAppActionMenu\\" class=\\"headerAppActionMenu\\"><div>FOO</div></div>"`
    );
  });

  it('clears the content of the component when emitting undefined', async () => {
    component = mount(<HeaderActionMenu actionMenu$={menuMount$} />);

    act(() => {
      menuMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerAppActionMenu\\" class=\\"headerAppActionMenu\\"><div>FOO</div></div>"`
    );

    act(() => {
      menuMount$.next(undefined);
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerAppActionMenu\\" class=\\"headerAppActionMenu\\"></div>"`
    );
  });

  it('updates the dom when a new mount point is emitted', async () => {
    component = mount(<HeaderActionMenu actionMenu$={menuMount$} />);

    act(() => {
      menuMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerAppActionMenu\\" class=\\"headerAppActionMenu\\"><div>FOO</div></div>"`
    );

    act(() => {
      menuMount$.next(createMountPoint('BAR'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerAppActionMenu\\" class=\\"headerAppActionMenu\\"><div>BAR</div></div>"`
    );
  });

  it('calls the previous mount point `unmount` when mounting a new mount point', async () => {
    component = mount(<HeaderActionMenu actionMenu$={menuMount$} />);

    act(() => {
      menuMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(Object.keys(unmounts)).toEqual(['FOO']);
    expect(unmounts.FOO).not.toHaveBeenCalled();

    act(() => {
      menuMount$.next(createMountPoint('BAR'));
    });
    await refresh();

    expect(Object.keys(unmounts)).toEqual(['FOO', 'BAR']);
    expect(unmounts.FOO).toHaveBeenCalledTimes(1);
    expect(unmounts.BAR).not.toHaveBeenCalled();
  });

  it('reports the mounted screen title and its later changes', async () => {
    const onScreenTitleChange = jest.fn();
    component = mount(
      <HeaderActionMenu actionMenu$={menuMount$} onScreenTitleChange={onScreenTitleChange} />
    );
    act(() => {
      menuMount$.next(createMountPoint('FOO', '<h1 data-osd-screen-title="">Logs</h1>'));
    });
    await refresh();
    await new Promise((resolve) => setImmediate(resolve));
    expect(onScreenTitleChange).toHaveBeenLastCalledWith('Logs');

    // Apps fill the title in after mount: the change is picked up.
    const h1 = component.getDOMNode().querySelector('[data-osd-screen-title]')!;
    h1.textContent = 'My dashboard';
    await new Promise((resolve) => setImmediate(resolve));
    expect(onScreenTitleChange).toHaveBeenLastCalledWith('My dashboard');

    act(() => {
      menuMount$.next(createMountPoint('BAR', '<div>no title</div>'));
    });
    await refresh();
    await new Promise((resolve) => setImmediate(resolve));
    expect(onScreenTitleChange).toHaveBeenLastCalledWith(undefined);
  });

  it('follows the title text and a replaced title element, but not text elsewhere', async () => {
    const onScreenTitleChange = jest.fn();
    component = mount(
      <HeaderActionMenu actionMenu$={menuMount$} onScreenTitleChange={onScreenTitleChange} />
    );
    act(() => {
      menuMount$.next(
        createMountPoint(
          'FOO',
          `<h1 ${SCREEN_TITLE_ATTRIBUTE}="">Logs</h1><span class="countdown">10</span>`
        )
      );
    });
    const flush = () => new Promise((resolve) => setImmediate(resolve));
    await flush();
    expect(onScreenTitleChange).toHaveBeenLastCalledWith('Logs');
    const root = component.getDOMNode();

    // Text edited in place, the way React updates `{screenTitle}`.
    root.querySelector(`[${SCREEN_TITLE_ATTRIBUTE}]`)!.firstChild!.nodeValue = 'Traces';
    await flush();
    expect(onScreenTitleChange).toHaveBeenLastCalledWith('Traces');

    // A text change outside the title is not observed: the menu is not even re-read.
    const countdown = root.querySelector('.countdown')!;
    const reads = jest.spyOn(root, 'querySelector');
    countdown.firstChild!.nodeValue = '9';
    await flush();
    expect(reads).not.toHaveBeenCalled();
    reads.mockRestore();

    // The title element replaced by a new one: the new element is read and watched.
    const replacement = document.createElement('h1');
    replacement.setAttribute(SCREEN_TITLE_ATTRIBUTE, '');
    replacement.textContent = 'Metrics';
    root.querySelector(`[${SCREEN_TITLE_ATTRIBUTE}]`)!.replaceWith(replacement);
    await flush();
    expect(onScreenTitleChange).toHaveBeenLastCalledWith('Metrics');
    replacement.firstChild!.nodeValue = 'Metrics 2';
    await flush();
    expect(onScreenTitleChange).toHaveBeenLastCalledWith('Metrics 2');
  });
});
