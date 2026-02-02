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

import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { UiComponent } from '../../../opensearch_dashboards_utils/public';
import { uiToReactComponent } from './ui_to_react_component';
import { reactToUiComponent } from './react_to_ui_component';
import { act } from 'react';

const UiComp: UiComponent<{ cnt?: number }> = () => ({
  render: (el, { cnt = 0 }) => {
    // eslint-disable-next-line no-unsanitized/property
    el.innerHTML = `cnt: ${cnt}`;
  },
});

describe('uiToReactComponent', () => {
  test('can render React component', () => {
    const ReactComp = uiToReactComponent(UiComp);
    const div = document.createElement('div');
    let root: Root;

    act(() => {
      root = createRoot(div);
      root.render(<ReactComp />);
    });

    expect(div.innerHTML).toBe('<div>cnt: 0</div>');

    act(() => {
      root!.unmount();
    });
  });

  test('can pass in props', async () => {
    const ReactComp = uiToReactComponent(UiComp);
    const div = document.createElement('div');
    let root: Root;

    act(() => {
      root = createRoot(div);
      root.render(<ReactComp cnt={5} />);
    });

    expect(div.innerHTML).toBe('<div>cnt: 5</div>');

    act(() => {
      root!.unmount();
    });
  });

  test('re-renders when React component is re-rendered', async () => {
    const ReactComp = uiToReactComponent(UiComp);
    const div = document.createElement('div');
    let root: Root;

    act(() => {
      root = createRoot(div);
      root.render(<ReactComp cnt={1} />);
    });

    expect(div.innerHTML).toBe('<div>cnt: 1</div>');

    act(() => {
      root.render(<ReactComp cnt={2} />);
    });

    expect(div.innerHTML).toBe('<div>cnt: 2</div>');

    act(() => {
      root!.unmount();
    });
  });

  test('does not crash if .unmount() not provided', () => {
    const UiComp2: UiComponent<{ cnt?: number }> = () => ({
      render: (el, { cnt = 0 }) => {
        // eslint-disable-next-line no-unsanitized/property
        el.innerHTML = `cnt: ${cnt}`;
      },
    });
    const ReactComp = uiToReactComponent(UiComp2);
    const div = document.createElement('div');
    let root: Root;

    act(() => {
      root = createRoot(div);
      root.render(<ReactComp cnt={1} />);
    });

    act(() => {
      root!.unmount();
    });

    expect(div.innerHTML).toBe('');
  });

  test('calls .unmount() method once when component un-mounts', () => {
    const unmount = jest.fn();
    const UiComp2: UiComponent<{ cnt?: number }> = () => ({
      render: (el, { cnt = 0 }) => {
        // eslint-disable-next-line no-unsanitized/property
        el.innerHTML = `cnt: ${cnt}`;
      },
      unmount,
    });
    const ReactComp = uiToReactComponent(UiComp2);
    const div = document.createElement('div');
    let root: Root;

    expect(unmount).toHaveBeenCalledTimes(0);

    act(() => {
      root = createRoot(div);
      root.render(<ReactComp cnt={1} />);
    });

    expect(unmount).toHaveBeenCalledTimes(0);

    act(() => {
      root!.unmount();
    });

    expect(unmount).toHaveBeenCalledTimes(1);
  });

  test('calls .render() method only once when components mounts, and once on every re-render', () => {
    const render = jest.fn((el, { cnt = 0 }) => {
      // eslint-disable-next-line no-unsanitized/property
      el.innerHTML = `cnt: ${cnt}`;
    });
    const UiComp2: UiComponent<{ cnt?: number }> = () => ({
      render,
    });
    const ReactComp = uiToReactComponent(UiComp2);
    const div = document.createElement('div');
    let root: Root;

    expect(render).toHaveBeenCalledTimes(0);

    act(() => {
      root = createRoot(div);
      root.render(<ReactComp cnt={1} />);
    });

    expect(render).toHaveBeenCalledTimes(1);

    act(() => {
      root.render(<ReactComp cnt={2} />);
    });

    expect(render).toHaveBeenCalledTimes(2);

    act(() => {
      root.render(<ReactComp cnt={3} />);
    });

    expect(render).toHaveBeenCalledTimes(3);

    act(() => {
      root!.unmount();
    });
  });

  test('can specify wrapper element', async () => {
    const ReactComp = uiToReactComponent(UiComp, 'span');
    const div = document.createElement('div');
    let root: Root;

    act(() => {
      root = createRoot(div);
      root.render(<ReactComp cnt={5} />);
    });

    expect(div.innerHTML).toBe('<span>cnt: 5</span>');

    act(() => {
      root!.unmount();
    });
  });
});

test('can adapt component many times', () => {
  const ReactComp = uiToReactComponent(
    reactToUiComponent(uiToReactComponent(reactToUiComponent(uiToReactComponent(UiComp))))
  );
  const div = document.createElement('div');
  let root: Root;

  act(() => {
    root = createRoot(div);
    root.render(<ReactComp />);
  });

  expect(div.textContent).toBe('cnt: 0');

  act(() => {
    root.render(<ReactComp cnt={123} />);
  });

  expect(div.textContent).toBe('cnt: 123');

  act(() => {
    root!.unmount();
  });
});
