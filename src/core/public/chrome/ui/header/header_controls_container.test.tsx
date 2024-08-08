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

import { mount, ReactWrapper } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { BehaviorSubject } from 'rxjs';
import { MountPoint, UnmountCallback } from '../../../types';
import { HeaderControlsContainer } from './header_controls_container';

type MockedUnmount = jest.MockedFunction<UnmountCallback>;

describe('HeaderControlsContainer', () => {
  let component: ReactWrapper;
  let controlMount$: BehaviorSubject<MountPoint | undefined>;
  let unmounts: Record<string, MockedUnmount>;

  beforeEach(() => {
    controlMount$ = new BehaviorSubject<MountPoint | undefined>(undefined);
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

  const createMountPoint = (id: string, content: string = id): MountPoint => (
    root
  ): MockedUnmount => {
    const container = document.createElement('DIV');
    // eslint-disable-next-line no-unsanitized/property
    container.innerHTML = content;
    root.appendChild(container);
    const unmount = jest.fn(() => container.remove());
    unmounts[id] = unmount;
    return unmount;
  };

  it('mounts the current value of the provided observable', async () => {
    component = mount(<HeaderControlsContainer controls$={controlMount$} />);

    act(() => {
      controlMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerControl\\" class=\\"euiHeaderSection euiHeaderSection--dontGrow headerControl\\"><div>FOO</div></div>"`
    );
  });

  it('clears the content of the component when emitting undefined', async () => {
    component = mount(<HeaderControlsContainer controls$={controlMount$} />);

    act(() => {
      controlMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerControl\\" class=\\"euiHeaderSection euiHeaderSection--dontGrow headerControl\\"><div>FOO</div></div>"`
    );

    act(() => {
      controlMount$.next(undefined);
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerControl\\" class=\\"euiHeaderSection euiHeaderSection--dontGrow headerControl\\"></div>"`
    );
  });

  it('updates the dom when a new mount point is emitted', async () => {
    component = mount(<HeaderControlsContainer controls$={controlMount$} />);

    act(() => {
      controlMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerControl\\" class=\\"euiHeaderSection euiHeaderSection--dontGrow headerControl\\"><div>FOO</div></div>"`
    );

    act(() => {
      controlMount$.next(createMountPoint('BAR'));
    });
    await refresh();

    expect(component.html()).toMatchInlineSnapshot(
      `"<div data-test-subj=\\"headerControl\\" class=\\"euiHeaderSection euiHeaderSection--dontGrow headerControl\\"><div>BAR</div></div>"`
    );
  });

  it('calls the previous mount point `unmount` when mounting a new mount point', async () => {
    component = mount(<HeaderControlsContainer controls$={controlMount$} />);

    act(() => {
      controlMount$.next(createMountPoint('FOO'));
    });
    await refresh();

    expect(Object.keys(unmounts)).toEqual(['FOO']);
    expect(unmounts.FOO).not.toHaveBeenCalled();

    act(() => {
      controlMount$.next(createMountPoint('BAR'));
    });
    await refresh();

    expect(Object.keys(unmounts)).toEqual(['FOO', 'BAR']);
    expect(unmounts.FOO).toHaveBeenCalledTimes(1);
    expect(unmounts.BAR).not.toHaveBeenCalled();
  });
});
