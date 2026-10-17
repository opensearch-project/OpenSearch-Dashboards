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

  it('passes the manage sub-path and re-mounts when navigating within the flow', async () => {
    const unmount = jest.fn();
    const flow = createFlow({ mount: jest.fn(() => unmount) });
    registry.registerDirectQueryConnectionFlow(flow);

    await render('/flows/flowA/manage/so-1');
    expect((flow.mount as jest.Mock).mock.calls[0][0].path).toBe('/manage/so-1');

    const { navigate } = (flow.mount as jest.Mock).mock.calls[0][0];
    await act(async () => {
      navigate('');
    });
    expect(history.location.pathname).toBe('/flows/flowA');
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(flow.mount).toHaveBeenCalledTimes(2);
    expect((flow.mount as jest.Mock).mock.calls[1][0].path).toBe('');
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

  it('renders a not-found callout for an unknown flow id', async () => {
    registry.registerDirectQueryConnectionFlow(createFlow());
    const component = await render('/flows/unknown');
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
