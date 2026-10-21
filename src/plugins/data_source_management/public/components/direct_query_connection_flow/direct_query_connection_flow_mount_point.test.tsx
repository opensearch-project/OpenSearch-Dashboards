/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { act } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Route, Router } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import { coreMock } from '../../../../../core/public/mocks';
import {
  DirectQueryConnectionFlow,
  DirectQueryConnectionFlowRegistry,
} from '../../direct_query_connection_flow_registry';
import { DirectQueryConnectionFlowMountPoint } from './direct_query_connection_flow_mount_point';
import {
  DIRECT_QUERY_CONNECTIONS_LIST_LOCATION,
  getDirectQueryConnectionFlowManagePath,
  getDirectQueryConnectionFlowPath,
  normalizeDirectQueryConnectionFlowSubPath,
  parseDirectQueryConnectionFlowPath,
} from './constants';

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe('direct query connection flow path helpers', () => {
  it('builds flow paths', () => {
    expect(getDirectQueryConnectionFlowPath('example-flow')).toBe('/flows/example-flow');
    expect(getDirectQueryConnectionFlowManagePath('example-flow', 'abc')).toBe(
      '/flows/example-flow/manage/abc'
    );
  });

  it('parses flow paths', () => {
    expect(parseDirectQueryConnectionFlowPath('/flows/a')).toEqual({ flowId: 'a', path: '' });
    expect(parseDirectQueryConnectionFlowPath('/flows/a/')).toEqual({ flowId: 'a', path: '' });
    expect(parseDirectQueryConnectionFlowPath('/flows/a/manage/x')).toEqual({
      flowId: 'a',
      path: '/manage/x',
    });
    expect(parseDirectQueryConnectionFlowPath('/manage/x')).toBeUndefined();
    expect(parseDirectQueryConnectionFlowPath('/flows')).toBeUndefined();
  });

  it('normalizes navigate sub-paths', () => {
    expect(normalizeDirectQueryConnectionFlowSubPath('')).toBe('');
    expect(normalizeDirectQueryConnectionFlowSubPath(undefined)).toBe('');
    expect(normalizeDirectQueryConnectionFlowSubPath('/')).toBe('');
    expect(normalizeDirectQueryConnectionFlowSubPath('manage/x')).toBe('/manage/x');
    expect(normalizeDirectQueryConnectionFlowSubPath('/manage/x')).toBe('/manage/x');
    expect(normalizeDirectQueryConnectionFlowSubPath('?x=1')).toBe('?x=1');
    expect(normalizeDirectQueryConnectionFlowSubPath('#top')).toBe('#top');
  });
});

describe('DirectQueryConnectionFlowMountPoint', () => {
  let history: MemoryHistory;
  let registry: DirectQueryConnectionFlowRegistry;
  let core: ReturnType<typeof coreMock.createStart>;
  let wrapper: ReactWrapper | undefined;

  const createFlow = (
    overrides: Partial<DirectQueryConnectionFlow> = {}
  ): DirectQueryConnectionFlow => ({
    id: 'flowA',
    title: 'Flow A',
    buttonLabel: 'Connect A',
    mount: jest.fn(() => jest.fn()),
    ...overrides,
  });

  const render = async (initialPath: string) => {
    history.push(initialPath);
    await act(async () => {
      wrapper = mount(
        <Router history={history}>
          <Route path={['/flows/:flowId', '/flows/:flowId/*']}>
            <DirectQueryConnectionFlowMountPoint registry={registry} core={core} />
          </Route>
        </Router>
      );
    });
    await flush();
    wrapper!.update();
    return wrapper!;
  };

  beforeEach(() => {
    history = createMemoryHistory();
    registry = new DirectQueryConnectionFlowRegistry();
    core = coreMock.createStart();
  });

  afterEach(() => {
    if (wrapper) {
      act(() => {
        wrapper!.unmount();
      });
      wrapper = undefined;
    }
  });

  it('mounts the flow with the expected params and unmounts it on leave', async () => {
    const unmount = jest.fn();
    const flow = createFlow({ mount: jest.fn(() => unmount) });
    registry.registerDirectQueryConnectionFlow(flow);

    const component = await render('/flows/flowA');
    expect(flow.mount).toHaveBeenCalledTimes(1);
    const params = (flow.mount as jest.Mock).mock.calls[0][0];
    expect(params.path).toBe('');
    expect(params.core).toBe(core);
    expect(params.element).toBeInstanceOf(HTMLElement);
    expect(
      component.find('div[data-test-subj="directQueryConnectionFlowMountPoint-flowA"]').getDOMNode()
    ).toBe(params.element);

    act(() => {
      component.unmount();
    });
    wrapper = undefined;
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('mounts once and reports sub-path changes through onPathChange', async () => {
    const unmount = jest.fn();
    const flow = createFlow({ mount: jest.fn(() => unmount) });
    registry.registerDirectQueryConnectionFlow(flow);

    await render('/flows/flowA/manage/so-1');
    const params = (flow.mount as jest.Mock).mock.calls[0][0];
    expect(params.path).toBe('/manage/so-1');
    const listener = jest.fn();
    params.onPathChange(listener);

    // Navigation inside the flow keeps it mounted.
    await act(async () => {
      params.navigate('');
    });
    expect(history.location.pathname).toBe('/flows/flowA');
    expect(listener).toHaveBeenLastCalledWith('');

    // So does navigation from outside the flow (e.g. browser back).
    await act(async () => {
      history.goBack();
    });
    expect(history.location.pathname).toBe('/flows/flowA/manage/so-1');
    expect(listener).toHaveBeenLastCalledWith('/manage/so-1');

    expect(flow.mount).toHaveBeenCalledTimes(1);
    expect(unmount).not.toHaveBeenCalled();
  });

  it('stops notifying a listener after it unsubscribes, and on unmount', async () => {
    const flow = createFlow();
    registry.registerDirectQueryConnectionFlow(flow);
    const component = await render('/flows/flowA');
    const params = (flow.mount as jest.Mock).mock.calls[0][0];
    const kept = jest.fn();
    const dropped = jest.fn();
    params.onPathChange(kept);
    const unsubscribe = params.onPathChange(dropped);
    unsubscribe();

    await act(async () => {
      params.navigate('/manage/so-2');
    });
    expect(kept).toHaveBeenCalledWith('/manage/so-2');
    expect(dropped).not.toHaveBeenCalled();

    act(() => {
      component.unmount();
    });
    wrapper = undefined;
    kept.mockClear();
    history.push('/flows/flowA/manage/so-3');
    expect(kept).not.toHaveBeenCalled();
  });

  it('tells a listener that subscribes after an async mount the path it missed', async () => {
    let resolveMount: (fn: () => void) => void = () => {};
    const flow = createFlow({
      mount: jest.fn(
        () =>
          new Promise<() => void>((resolve) => {
            resolveMount = resolve;
          })
      ),
    });
    registry.registerDirectQueryConnectionFlow(flow);
    await render('/flows/flowA');
    const params = (flow.mount as jest.Mock).mock.calls[0][0];
    expect(params.path).toBe('');

    // The route changes while the flow is still loading.
    await act(async () => {
      history.push('/flows/flowA/manage/x');
    });
    const listener = jest.fn();
    await act(async () => {
      resolveMount(jest.fn());
      params.onPathChange(listener);
    });
    expect(listener).toHaveBeenCalledWith('/manage/x');
    expect(flow.mount).toHaveBeenCalledTimes(1);
  });

  it("does not report another flow's paths to an abandoned async mount", async () => {
    let subscribeA: ((listener: (path: string) => void) => () => void) | undefined;
    const flowA = createFlow({
      mount: jest.fn((params) => {
        subscribeA = params.onPathChange;
        return new Promise<() => void>(() => {});
      }),
    });
    const flowB = createFlow({ id: 'flowB', title: 'Flow B' });
    registry.registerDirectQueryConnectionFlow(flowA);
    registry.registerDirectQueryConnectionFlow(flowB);
    await render('/flows/flowA');
    await act(async () => {
      history.push('/flows/flowB');
    });
    await flush();
    // A's mount never resolved; it subscribes only now.
    const listenerA = jest.fn();
    subscribeA!(listenerA);
    await act(async () => {
      history.push('/flows/flowB/manage/y');
    });
    expect(listenerA).not.toHaveBeenCalled();
    expect(flowB.mount).toHaveBeenCalledTimes(1);
  });

  it('does not mount a hidden flow the route switches to from a visible one', async () => {
    const flowA = createFlow();
    const flowB = createFlow({ id: 'flowB', title: 'Flow B', isVisible: () => false });
    registry.registerDirectQueryConnectionFlow(flowA);
    registry.registerDirectQueryConnectionFlow(flowB);
    const component = await render('/flows/flowA');
    expect(flowA.mount).toHaveBeenCalledTimes(1);
    await act(async () => {
      history.push('/flows/flowB');
    });
    await flush();
    component.update();
    expect(flowB.mount).not.toHaveBeenCalled();
    expect(component.find('[data-test-subj="directQueryConnectionFlowNotFound"]').exists()).toBe(
      true
    );
  });

  it('adds a missing leading slash to a navigate sub-path', async () => {
    const flow = createFlow();
    registry.registerDirectQueryConnectionFlow(flow);
    await render('/flows/flowA');
    const { navigate } = (flow.mount as jest.Mock).mock.calls[0][0];
    await act(async () => {
      navigate('manage/x');
    });
    expect(history.location.pathname).toBe('/flows/flowA/manage/x');
    await act(async () => {
      navigate('/');
    });
    expect(history.location.pathname).toBe('/flows/flowA');
  });

  it('re-mounts when the route switches to another flow', async () => {
    const unmountA = jest.fn();
    const flowA = createFlow({ mount: jest.fn(() => unmountA) });
    const flowB = createFlow({ id: 'flowB', title: 'Flow B' });
    registry.registerDirectQueryConnectionFlow(flowA);
    registry.registerDirectQueryConnectionFlow(flowB);
    await render('/flows/flowA');
    await act(async () => {
      history.push('/flows/flowB');
    });
    await flush();
    expect(unmountA).toHaveBeenCalledTimes(1);
    expect(flowB.mount).toHaveBeenCalledTimes(1);
  });

  it('resolves isVisible once per registry for every route visit', async () => {
    const isVisible = jest.fn(() => true);
    const flow = createFlow({ isVisible });
    registry.registerDirectQueryConnectionFlow(flow);
    await render('/flows/flowA');
    act(() => {
      wrapper!.unmount();
    });
    wrapper = undefined;
    await render('/flows/flowA/manage/so-1');
    expect(isVisible).toHaveBeenCalledTimes(1);
    expect(flow.mount).toHaveBeenCalledTimes(2);
  });

  it('navigateToList returns to the Direct query connections tab', async () => {
    const flow = createFlow();
    registry.registerDirectQueryConnectionFlow(flow);
    await render('/flows/flowA');
    const { navigateToList } = (flow.mount as jest.Mock).mock.calls[0][0];
    await act(async () => {
      navigateToList();
    });
    expect(history.location.pathname).toBe('/');
    expect(history.location.state).toEqual(DIRECT_QUERY_CONNECTIONS_LIST_LOCATION.state);
  });

  it('supports async mount and cleans up when unmounted before mount resolves', async () => {
    const unmount = jest.fn();
    let resolveMount: (fn: () => void) => void = () => {};
    const flow = createFlow({
      mount: jest.fn(
        () =>
          new Promise<() => void>((resolve) => {
            resolveMount = resolve;
          })
      ),
    });
    registry.registerDirectQueryConnectionFlow(flow);

    const component = await render('/flows/flowA');
    expect(flow.mount).toHaveBeenCalledTimes(1);
    act(() => {
      component.unmount();
    });
    wrapper = undefined;
    expect(unmount).not.toHaveBeenCalled();
    await act(async () => {
      resolveMount(unmount);
    });
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('does not mount a flow whose isVisible rejects', async () => {
    const flow = createFlow({ isVisible: () => Promise.reject(new Error('nope')) });
    registry.registerDirectQueryConnectionFlow(flow);
    const component = await render('/flows/flowA');
    expect(flow.mount).not.toHaveBeenCalled();
    expect(component.find('[data-test-subj="directQueryConnectionFlowNotFound"]').exists()).toBe(
      true
    );
  });

  it('renders a not-found callout for an unknown flow id, without a spinner first', async () => {
    registry.registerDirectQueryConnectionFlow(createFlow());
    history.push('/flows/unknown');
    // First render, before any effect has run.
    const component = mount(
      <Router history={history}>
        <Route path={['/flows/:flowId', '/flows/:flowId/*']}>
          <DirectQueryConnectionFlowMountPoint registry={registry} core={core} />
        </Route>
      </Router>
    );
    wrapper = component;
    expect(component.find('EuiLoadingSpinner').exists()).toBe(false);
    expect(component.find('[data-test-subj="directQueryConnectionFlowNotFound"]').exists()).toBe(
      true
    );
  });

  it('shows a danger toast when mount throws', async () => {
    const flow = createFlow({
      mount: jest.fn(() => {
        throw new Error('broken');
      }),
    });
    registry.registerDirectQueryConnectionFlow(flow);
    await render('/flows/flowA');
    expect(core.notifications.toasts.addDanger).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'broken' })
    );
  });
});
