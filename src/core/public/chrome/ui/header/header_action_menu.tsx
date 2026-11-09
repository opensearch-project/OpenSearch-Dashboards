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

import { FC, useRef, useLayoutEffect, useState } from 'react';
import { Observable } from 'rxjs';
import { MountPoint, UnmountCallback } from '../../../types';
import { SCREEN_TITLE_ATTRIBUTE } from '../../constants';

interface HeaderActionMenuProps {
  actionMenu$: Observable<MountPoint | undefined>;
  /** Called with the mounted screen title's text, or undefined when there is none. */
  onScreenTitleChange?: (screenTitle: string | undefined) => void;
}

export const HeaderActionMenu: FC<HeaderActionMenuProps> = ({
  actionMenu$,
  onScreenTitleChange,
}) => {
  // useObservable relies on useState under the hood. The signature is type SetStateAction<S> = S | ((prevState: S) => S);
  // As we got a Observable<Function> here, React's setState setter assume he's getting a `(prevState: S) => S` signature,
  // therefore executing the mount method, causing everything to crash.
  // piping the observable before calling `useObservable` causes the effect to always having a new reference, as
  // the piped observable is a new instance on every render, causing infinite loops.
  // this is why we use `useLayoutEffect` manually here.
  const [mounter, setMounter] = useState<{ mount: MountPoint | undefined }>({ mount: undefined });
  useLayoutEffect(() => {
    const s = actionMenu$.subscribe((value) => {
      setMounter({ mount: value });
    });
    return () => s.unsubscribe();
  }, [actionMenu$]);

  const elementRef = useRef<HTMLDivElement>(null);
  const unmountRef = useRef<UnmountCallback | null>(null);

  useLayoutEffect(() => {
    if (unmountRef.current) {
      unmountRef.current();
      unmountRef.current = null;
    }

    if (mounter.mount && elementRef.current) {
      try {
        unmountRef.current = mounter.mount(elementRef.current);
      } catch (e) {
        // TODO: use client-side logger when feature is implemented
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  }, [mounter]);

  // Report the app's screen title. Apps often fill it in after mount (an
  // effect sets it once data loads), so keep watching. The menu root is
  // watched only for added and removed nodes, which is how the title element
  // appears, disappears or is replaced; its text is watched on the title
  // element alone, so text changes elsewhere in the menu (the date picker,
  // a refresh countdown) don't trigger a read.
  useLayoutEffect(() => {
    const root = elementRef.current;
    if (!onScreenTitleChange || !root) return;
    let last: string | undefined;
    let titleElement: Element | null = null;
    // `report` is defined below; the observers only call it after this effect has run.
    const titleObserver = new MutationObserver(() => report());
    const report = () => {
      const element = root.querySelector(`[${SCREEN_TITLE_ATTRIBUTE}]`);
      if (element !== titleElement) {
        titleObserver.disconnect();
        titleElement = element;
        if (element) {
          titleObserver.observe(element, { childList: true, subtree: true, characterData: true });
        }
      }
      const next = element?.textContent?.trim() || undefined;
      if (next !== last) {
        last = next;
        onScreenTitleChange(next);
      }
    };
    const rootObserver = new MutationObserver(report);
    rootObserver.observe(root, { childList: true, subtree: true });
    report();
    return () => {
      rootObserver.disconnect();
      titleObserver.disconnect();
      onScreenTitleChange(undefined);
    };
  }, [onScreenTitleChange]);

  return (
    <div data-test-subj="headerAppActionMenu" className="headerAppActionMenu" ref={elementRef} />
  );
};
