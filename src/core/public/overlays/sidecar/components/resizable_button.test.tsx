/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { ResizableButton } from './resizable_button';
import { mount, shallow } from 'enzyme';
import { SIDECAR_DOCKED_MODE } from '../sidecar_service';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/dom';
import { MIN_SIDECAR_SIZE } from '../helper';

const originalAddEventListener = window.addEventListener;

const restoreWindowEvents = () => {
  window.addEventListener = originalAddEventListener;
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
  dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
  onResize: jest.fn(),
  flyoutSize: DEFAULT_FLYOUT_SIZE,
};

test('is rendered', () => {
  const component = shallow(<ResizableButton {...props} />);
  expect(component).toMatchSnapshot();
});

test('it should be horizontal when docked mode is right', () => {
  const component = shallow(<ResizableButton {...props} />);
  expect(component.hasClass('resizableButton--horizontal')).toBe(true);
  expect(component.hasClass('resizableButton--vertical')).toBe(false);
  expect(component).toMatchSnapshot();
});

test('it should be vertical when docked mode is takeover', () => {
  const newProps = { ...props, dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER };
  const component = shallow(<ResizableButton {...newProps} />);
  expect(component.hasClass('resizableButton--vertical')).toBe(true);
  expect(component.hasClass('resizableButton--horizontal')).toBe(false);
  expect(component).toMatchSnapshot();
});

test('it should emit onResize with new flyout size when docked right and drag and horizontal', () => {
  const windowEvents = storeWindowEvents();

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 2000,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 2000,
  });

  const onResize = jest.fn();
  const newProps = { ...props, onResize };
  const component = shallow(<ResizableButton {...newProps} />);
  const resizer = component.find(`[data-test-subj~="resizableButton"]`).first();
  expect(onResize).not.toHaveBeenCalled();
  resizer.simulate('mousedown', { clientX: 0, pageX: 0, pageY: 0 });
  windowEvents?.mousemove({ clientX: -1000, pageX: 0, pageY: 0 });
  windowEvents?.mouseup();
  const newSize = 1000 + DEFAULT_FLYOUT_SIZE;
  expect(onResize).toHaveBeenCalledWith(newSize);
  expect(component).toMatchSnapshot();
});

test('it should emit onResize with new flyout size when docked left and drag and horizontal', () => {
  const windowEvents = storeWindowEvents();

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 2000,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 2000,
  });

  const onResize = jest.fn();
  const newProps = { ...props, onResize, dockedMode: SIDECAR_DOCKED_MODE.LEFT };
  const component = shallow(<ResizableButton {...newProps} />);
  const resizer = component.find(`[data-test-subj~="resizableButton"]`).first();
  expect(onResize).not.toHaveBeenCalled();
  resizer.simulate('mousedown', { clientX: 0, pageX: 0, pageY: 0 });
  windowEvents?.mousemove({ clientX: 1000, pageX: 0, pageY: 0 });
  windowEvents?.mouseup();
  const newSize = 1000 + DEFAULT_FLYOUT_SIZE;
  expect(onResize).toHaveBeenCalledWith(newSize);
  expect(component).toMatchSnapshot();
});

test('it should emit onResize with new flyout size when drag and vertical', () => {
  const windowEvents = storeWindowEvents();

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 2000,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 2000,
  });

  const onResize = jest.fn();
  const newProps = { ...props, onResize, dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER };
  const component = shallow(<ResizableButton {...newProps} />);
  const resizer = component.find(`[data-test-subj~="resizableButton"]`).first();
  expect(onResize).not.toHaveBeenCalled();
  resizer.simulate('mousedown', { clientY: 0, pageX: 0, pageY: 0 });
  windowEvents?.mousemove({ clientY: -1000, pageX: 0, pageY: 0 });
  windowEvents?.mouseup();
  const newSize = 1000 + DEFAULT_FLYOUT_SIZE;
  expect(onResize).toHaveBeenCalledWith(newSize);
  expect(component).toMatchSnapshot();
});

test('it should emit onResize with min size when drag if new size is below the minimum', () => {
  const windowEvents = storeWindowEvents();

  const onResize = jest.fn();
  const newProps = { ...props, onResize };
  const component = shallow(<ResizableButton {...newProps} />);
  const resizer = component.find(`[data-test-subj~="resizableButton"]`).first();
  expect(onResize).not.toHaveBeenCalled();
  resizer.simulate('mousedown', { clientX: 0, pageX: 0, pageY: 0 });
  windowEvents?.mousemove({ clientX: 1000, pageX: 0, pageY: 0 });
  windowEvents?.mouseup();
  const newSize = MIN_SIDECAR_SIZE;
  expect(onResize).toHaveBeenCalledWith(newSize);
  expect(component).toMatchSnapshot();
});

test('it should not call onResize when new size exceeds window bounds', () => {
  const windowEvents = storeWindowEvents();
  const onResize = jest.fn();

  // Mock window dimensions
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1200,
  });

  // Test takeover mode with size exceeding window height
  const takeoverProps = {
    ...props,
    onResize,
    dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
  };
  const takeoverComponent = shallow(<ResizableButton {...takeoverProps} />);
  const takeoverResizer = takeoverComponent.find(`[data-test-subj~="resizableButton"]`).first();

  takeoverResizer.simulate('mousedown', { clientY: 0, pageX: 0, pageY: 0 });
  let mouseMoveEvent = new MouseEvent('mousemove', {
    clientY: -2000,
    pageX: 0,
    pageY: 0,
  } as any);
  windowEvents?.mousemove(mouseMoveEvent); // Exceeds window.innerHeight
  windowEvents?.mouseup();

  expect(onResize).not.toHaveBeenCalled();

  // Test right mode with size exceeding window width
  const rightProps = {
    ...props,
    onResize,
    dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
  };
  const rightComponent = shallow(<ResizableButton {...rightProps} />);
  const rightResizer = rightComponent.find(`[data-test-subj~="resizableButton"]`).first();

  rightResizer.simulate('mousedown', { clientX: 0, pageX: 0, pageY: 0 });
  mouseMoveEvent = new MouseEvent('mousemove', { clientX: -2000, pageX: 0, pageY: 0 } as any);
  windowEvents?.mousemove(mouseMoveEvent); // Exceeds window.innerWidth
  windowEvents?.mouseup();

  expect(onResize).not.toHaveBeenCalled();
});

test('it should handle window resize events correctly for different docked modes', async () => {
  restoreWindowEvents();
  const onResize = jest.fn();

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1200,
  });

  const takeoverProps = {
    ...props,
    onResize,
    dockedMode: SIDECAR_DOCKED_MODE.TAKEOVER,
    flyoutSize: 800,
  };
  let component = mount(<ResizableButton {...takeoverProps} />);

  await act(async () => {
    Object.defineProperty(window, 'innerHeight', { value: 600 });
    window.dispatchEvent(new Event('resize'));
  });

  await waitFor(() => {
    // wait for debounce
    expect(onResize).toHaveBeenCalledWith(600);
  });
  onResize.mockClear();

  const rightProps = {
    ...props,
    onResize,
    dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
    flyoutSize: 1000,
  };
  component = mount(<ResizableButton {...rightProps} />);

  await act(async () => {
    Object.defineProperty(window, 'innerWidth', { value: 800 });
    window.dispatchEvent(new Event('resize'));
  });

  await waitFor(() => {
    // wait for debounce
    expect(onResize).toHaveBeenCalledWith(800);
  });

  component.unmount();
});
