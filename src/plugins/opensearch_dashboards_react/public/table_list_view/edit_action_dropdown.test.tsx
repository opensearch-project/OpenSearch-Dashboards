/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import { EditActionDropdown, VisualizationItem } from './edit_action_dropdown';
import { EuiContextMenuPanel, EuiIcon, EuiPopover, EuiContextMenuItem } from '@elastic/eui';

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
    expect(component.find(EuiIcon).first().prop('type')).toBe('pencil');
  });

  it('opens the popover when icon is clicked', () => {
    act(() => {
      component.find(EuiIcon).first().simulate('click');
    });
    component.update();
    expect(component.find(EuiPopover).prop('isOpen')).toBe(true);
  });

  it('renders context menu panel with correct options for VisBuilder compatible item', () => {
    act(() => {
      component.find(EuiIcon).first().simulate('click');
    });
    component.update();
    const contextMenuPanel = component.find(EuiContextMenuPanel);
    expect(contextMenuPanel.exists()).toBe(true);
    expect(contextMenuPanel.prop('items')).toHaveLength(2);
    expect(contextMenuPanel.find(EuiContextMenuItem).at(0).text()).toBe('Edit');
    expect(contextMenuPanel.find(EuiContextMenuItem).at(1).text()).toBe('Import to VisBuilder');
  });

  it('does not render VisBuilder option for incompatible item', () => {
    const incompatibleItem: VisualizationItem = {
      typeTitle: 'Pie',
      id: '2',
      version: 2,
    };
    component.setProps({ item: incompatibleItem });
    act(() => {
      component.find(EuiIcon).first().simulate('click');
    });
    component.update();
    const contextMenuPanel = component.find(EuiContextMenuPanel);
    expect(contextMenuPanel.prop('items')).toHaveLength(1);
    expect(contextMenuPanel.find(EuiContextMenuItem).at(0).text()).toBe('Edit');
  });

  it('calls editItem when Edit option is clicked', () => {
    act(() => {
      component.find(EuiIcon).first().simulate('click');
    });
    component.update();
    act(() => {
      component.find(EuiContextMenuItem).at(0).simulate('click');
    });
    expect(mockEditItem).toHaveBeenCalledWith(defaultItem);
  });

  it('calls visbuilderEditItem when Import to VisBuilder option is clicked', () => {
    act(() => {
      component.find(EuiIcon).first().simulate('click');
    });
    component.update();
    act(() => {
      component.find(EuiContextMenuItem).at(1).simulate('click');
    });
    expect(mockVisbuilderEditItem).toHaveBeenCalledWith(defaultItem);
  });

  it('closes the popover after an action is selected', () => {
    act(() => {
      component.find(EuiIcon).first().simulate('click');
    });
    component.update();
    act(() => {
      component.find(EuiContextMenuItem).at(0).simulate('click');
    });
    component.update();
    expect(component.find(EuiPopover).prop('isOpen')).toBe(false);
  });

  it('sets correct props on EuiPopover', () => {
    const popover = component.find(EuiPopover);
    expect(popover.prop('panelPaddingSize')).toBe('none');
    expect(popover.prop('anchorPosition')).toBe('downLeft');
    expect(popover.prop('initialFocus')).toBe('none');
  });

  it('sets correct props on EuiContextMenuPanel', () => {
    act(() => {
      component.find(EuiIcon).first().simulate('click');
    });
    component.update();
    const panel = component.find(EuiContextMenuPanel);
    expect(panel.prop('size')).toBe('s');
  });
});
