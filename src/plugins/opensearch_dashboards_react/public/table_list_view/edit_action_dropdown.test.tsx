/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { EditActionDropdown, VisualizationItem } from './edit_action_dropdown';
import { EuiContextMenu, EuiIcon, EuiPopover } from '@elastic/eui';

describe('EditActionDropdown', () => {
  let component: any;
  const mockEditItem = jest.fn();
  const mockVisbuilderEditItem = jest.fn();

  const defaultItem: VisualizationItem = {
    typeTitle: 'Area',
    id: '1',
    version: 1,
  };

  beforeEach(() => {
    component = mount(
      <EditActionDropdown
        item={defaultItem}
        editItem={mockEditItem}
        visbuilderEditItem={mockVisbuilderEditItem}
      />
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the edit icon', () => {
    expect(component.find(EuiIcon).prop('type')).toBe('pencil');
  });

  it('opens the popover when icon is clicked', () => {
    act(() => {
      component.find(EuiIcon).simulate('click');
    });
    component.update();
    expect(component.find(EuiPopover).prop('isOpen')).toBe(true);
  });

  it('renders context menu with correct options for VisBuilder compatible item', () => {
    act(() => {
      component.find(EuiIcon).simulate('click');
    });
    component.update();
    const contextMenu = component.find(EuiContextMenu);
    expect(contextMenu.exists()).toBe(true);
    expect(contextMenu.prop('panels')[0].items).toHaveLength(2);
    expect(contextMenu.prop('panels')[0].items[0].name).toBe('Edit');
    expect(contextMenu.prop('panels')[0].items[1].name).toBe('Import to VisBuilder');
  });

  it('does not render VisBuilder option for incompatible item', () => {
    const incompatibleItem: VisualizationItem = {
      typeTitle: 'Pie',
      id: '2',
      version: 2,
    };
    component.setProps({ item: incompatibleItem });
    act(() => {
      component.find(EuiIcon).simulate('click');
    });
    component.update();
    const contextMenu = component.find(EuiContextMenu);
    expect(contextMenu.prop('panels')[0].items).toHaveLength(1);
    expect(contextMenu.prop('panels')[0].items[0].name).toBe('Edit');
  });

  it('calls editItem when Edit option is clicked', () => {
    act(() => {
      component.find(EuiIcon).simulate('click');
    });
    component.update();
    act(() => {
      component.find(EuiContextMenu).prop('panels')[0].items[0].onClick();
    });
    expect(mockEditItem).toHaveBeenCalledWith(defaultItem);
  });

  it('calls visbuilderEditItem when Import to VisBuilder option is clicked', () => {
    act(() => {
      component.find(EuiIcon).simulate('click');
    });
    component.update();
    act(() => {
      component.find(EuiContextMenu).prop('panels')[0].items[1].onClick();
    });
    expect(mockVisbuilderEditItem).toHaveBeenCalledWith(defaultItem);
  });

  it('closes the popover after an action is selected', () => {
    act(() => {
      component.find(EuiIcon).simulate('click');
    });
    component.update();
    act(() => {
      component.find(EuiContextMenu).prop('panels')[0].items[0].onClick();
    });
    component.update();
    expect(component.find(EuiPopover).prop('isOpen')).toBe(false);
  });
});
