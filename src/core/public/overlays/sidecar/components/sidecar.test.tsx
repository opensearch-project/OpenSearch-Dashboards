/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { render, mount } from 'enzyme';
import { BehaviorSubject } from 'rxjs';

import { ISidecarConfig, SIDECAR_DOCKED_MODE } from '../sidecar_service';
import { Sidecar, Props } from './sidecar';
import { i18nServiceMock } from '../../../i18n/i18n_service.mock';

const i18nMock = i18nServiceMock.createStartContract();
const mountText = (text: string) => (container: HTMLElement) => {
  const content = document.createElement('span');
  content.textContent = text;
  container.append(content);
  return () => {};
};

const storeWindowEvents = () => {
  const map: Record<string, Function> = {};
  window.addEventListener = jest.fn().mockImplementation((event: string, cb) => {
    map[event] = cb;
  });
  return map;
};

const DEFAULT_FLYOUT_SIZE = 460;
const props = {
  sidecarConfig$: new BehaviorSubject<ISidecarConfig>({
    dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
    paddingSize: DEFAULT_FLYOUT_SIZE,
    isHidden: false,
  }),
  options: {
    'data-test-subj': 'sidecar-component-wrapper',
  },
  setSidecarConfig: jest.fn(),
  i18n: i18nMock,
  mount: mountText('sidecar content'),
};

describe('Sidecar component', () => {
  test('is rendered', () => {
    const component = render(<Sidecar {...((props as unknown) as Props)} />);
    expect(component).toMatchSnapshot();
  });

  test('it should emit setSidecarConfig with new style when resize', () => {
    const setSidecarConfig = jest.fn();
    const newProps = {
      ...props,
      setSidecarConfig,
    };
    const windowEvents = storeWindowEvents();
    const component = mount(<Sidecar {...((newProps as unknown) as Props)} />);
    expect(component).toMatchSnapshot();
    expect(setSidecarConfig).not.toHaveBeenCalled();
    const resizer = component.find(`[data-test-subj~="resizableButton"]`).first();
    resizer.simulate('mousedown', { clientX: 0, pageX: 0, pageY: 0 });
    windowEvents?.mousemove({ clientX: -1000, pageX: 0, pageY: 0 });
    windowEvents?.mouseup();
    expect(setSidecarConfig).toHaveBeenCalledWith({ paddingSize: 1000 + DEFAULT_FLYOUT_SIZE });
  });

  test('it should have a width style when dockedDirection is right', () => {
    const component = mount(<Sidecar {...((props as unknown) as Props)} />);
    expect(component).toMatchSnapshot();
    const wrapperProps = component.find(`[data-test-subj~="sidecar-component-wrapper"]`).get(0)
      .props;
    expect(wrapperProps.style).toHaveProperty('width', DEFAULT_FLYOUT_SIZE);
    expect(wrapperProps.style).not.toHaveProperty('height');
  });

  test('it should have a height style when dockedDirection is takeover', () => {
    const newProps = {
      ...props,
      sidecarConfig$: new BehaviorSubject<ISidecarConfig>({
        dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
        paddingSize: DEFAULT_FLYOUT_SIZE,
        isHidden: false,
      }),
    };

    const component = mount(<Sidecar {...((newProps as unknown) as Props)} />);
    expect(component).toMatchSnapshot();
    const wrapperProps = component.find(`[data-test-subj~="sidecar-component-wrapper"]`).get(0)
      .props;
    expect(wrapperProps.style).toHaveProperty('height', DEFAULT_FLYOUT_SIZE);
    expect(wrapperProps.style).not.toHaveProperty('width');
  });

  test('it should have a height style when isHidden is true', () => {
    const newProps = {
      ...props,
      sidecarConfig$: new BehaviorSubject<ISidecarConfig>({
        dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
        paddingSize: DEFAULT_FLYOUT_SIZE,
        isHidden: true,
      }),
    };

    const component = mount(<Sidecar {...((newProps as unknown) as Props)} />);
    expect(component).toMatchSnapshot();
    expect(
      component
        .find(`[data-test-subj~="sidecar-component-wrapper"]`)
        .hasClass('osdSidecarFlyout--hide')
    );
  });
});
