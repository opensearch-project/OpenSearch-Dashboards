/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { ResizableButton, MIN_SIDECAR_SIZE } from './resizable_button';
import { shallow } from 'enzyme';
import { SIDECAR_DOCKED_MODE } from '../sidecar_service';

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
