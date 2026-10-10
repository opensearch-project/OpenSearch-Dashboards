/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'events';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';

import { DefaultEditorSideBar } from './sidebar';

jest.mock('./state', () => ({
  setStateParamValue: jest.fn(),
  discardChanges: jest.fn(),
  useEditorReducer: () => [
    { params: {}, data: { aggs: { aggs: [], getResponseAggs: () => [] } } },
    jest.fn(),
  ],
  useEditorFormState: () => ({
    formState: { invalid: false, touched: false },
    setTouched: jest.fn(),
    setValidity: jest.fn(),
    resetValidity: jest.fn(),
  }),
}));
jest.mock('./use_option_tabs', () => ({ useOptionTabs: () => [[], jest.fn()] }));
jest.mock('./controls', () => ({ DefaultEditorControls: () => null }));
jest.mock('./navbar', () => ({ DefaultEditorNavBar: () => null }));
jest.mock('./sidebar_title', () => ({ SidebarTitle: () => null }));

describe('DefaultEditorSideBar Ctrl+Enter submit', () => {
  const setup = () => {
    const eventEmitter = new EventEmitter();
    const vis: any = {
      type: { schemas: {}, requiresSearch: false },
      serialize: () => ({}),
      setState: jest.fn(),
    };
    const embeddableHandler: any = { reload: jest.fn() };
    const wrapper = mount(
      <DefaultEditorSideBar
        embeddableHandler={embeddableHandler}
        isCollapsed={false}
        onClickCollapse={jest.fn()}
        uiState={{} as any}
        vis={vis}
        isLinkedSearch={false}
        eventEmitter={eventEmitter}
        timeRange={{ from: 'now-15m', to: 'now' }}
      />
    );
    // applyChanges is a no-op unless the editor is dirty
    act(() => {
      eventEmitter.emit('dirtyStateChange', { isDirty: true });
    });
    wrapper.update();
    return { wrapper, vis, embeddableHandler };
  };

  const keyDown = (wrapper: ReturnType<typeof setup>['wrapper'], nativeEvent: object) =>
    wrapper.find('form').simulate('keydown', { key: 'Enter', ctrlKey: true, nativeEvent });

  it('does not apply changes on Ctrl+Enter while an IME composition is active', () => {
    const { wrapper, vis, embeddableHandler } = setup();
    keyDown(wrapper, { isComposing: true });
    expect(vis.setState).not.toHaveBeenCalled();
    expect(embeddableHandler.reload).not.toHaveBeenCalled();
  });

  it('applies changes once on plain Ctrl+Enter', () => {
    const { wrapper, vis, embeddableHandler } = setup();
    keyDown(wrapper, { isComposing: false });
    expect(vis.setState).toHaveBeenCalledTimes(1);
    expect(embeddableHandler.reload).toHaveBeenCalledTimes(1);
  });
});
