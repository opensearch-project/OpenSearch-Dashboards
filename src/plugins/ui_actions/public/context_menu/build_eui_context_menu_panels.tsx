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
import {
  EuiContextMenuPanelDescriptor,
  EuiContextMenuPanelItemDescriptor,
  EuiText,
} from '@elastic/eui';
import _ from 'lodash';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../core/public';
import { uiToReactComponent } from '../../../opensearch_dashboards_react/public';
import {
  Action,
  ActionExecutionContext,
  ActionContextMenuData,
  ActionContextMenuDataFirstPanelGroup,
  GetContextMenuDataType,
} from '../actions';
import { Trigger } from '../triggers';
import { BaseContext } from '../types';
import './styles.scss';

export const defaultTitle = i18n.translate('uiActions.actionPanel.title', {
  defaultMessage: 'Options',
});

export const txtMore = i18n.translate('uiActions.actionPanel.more', {
  defaultMessage: 'More',
});

interface ActionWithContext<Context extends BaseContext = BaseContext> {
  action: Action<Context>;
  context: Context;

  /**
   * Trigger that caused this action
   */
  trigger: Trigger;
}

type ItemDescriptor = EuiContextMenuPanelItemDescriptor & {
  _order: number;
  _title?: string;
};

type PanelDescriptor = EuiContextMenuPanelDescriptor & {
  _level?: number;
  _icon?: string;
  items: ItemDescriptor[];
};

const onClick = (action: Action, context: ActionExecutionContext<object>, close: () => void) => (
  event: React.MouseEvent
) => {
  if (event.currentTarget instanceof HTMLAnchorElement) {
    // from react-router's <Link/>
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      (!event.currentTarget.target || event.currentTarget.target === '_self') && // let browser handle "target=_blank" etc.
      !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) // ignore clicks with modifier keys
    ) {
      event.preventDefault();
      action.execute(context);
    }
  } else action.execute(context);
  close();
};

/**
 * This method adds "More" item to panels, which have more than 4 items; and
 * moves all items after the thrird one into that "More" sub-menu.
 */
const wrapMainPanelItemsIntoSubmenu = (panels: Record<string, PanelDescriptor>, id: string) => {
  const panel = panels[id];
  if (!panel) return;
  const maxItemsBeforeWrapping = 4;
  if (!panel.items) return;
  if (panel.items.length <= maxItemsBeforeWrapping) return;
  const visibleItems = panel.items.slice(0, 3) as ItemDescriptor[];
  const itemsInSubmenu = panel.items.slice(3) as ItemDescriptor[];
  const morePanelId = panel.id + '__more';
  const more: ItemDescriptor = {
    name: txtMore,
    panel: morePanelId,
    icon: 'boxesHorizontal',
    'data-test-subj': `embeddablePanelMore-${id}`,
    _order: -1,
  };
  panel.items = [...visibleItems, more];
  const subPanel: PanelDescriptor = {
    id: morePanelId,
    title: panel.title || defaultTitle,
    items: itemsInSubmenu,
  };
  panels[morePanelId] = subPanel;
};

const removeItemMetaFields = (items: ItemDescriptor[]): EuiContextMenuPanelItemDescriptor[] => {
  const euiItems: EuiContextMenuPanelItemDescriptor[] = [];
  for (const item of items) {
    const { _order: omit, _title: omit2, ...rest } = item;
    euiItems.push(rest);
  }
  return euiItems;
};

const removePanelMetaFields = (panels: PanelDescriptor[]): EuiContextMenuPanelDescriptor[] => {
  const euiPanels: EuiContextMenuPanelDescriptor[] = [];
  for (const panel of panels) {
    const { _level: omit, _icon: omit2, ...rest } = panel;
    euiPanels.push({ ...rest, items: removeItemMetaFields(rest.items) });
  }
  return euiPanels;
};

export interface BuildContextMenuParams {
  actions: ActionWithContext[];
  title?: string;
  closeMenu?: () => void;
  overlays?: CoreStart['overlays'];
}

/**
 * Transforms an array of Actions to the shape EuiContextMenuPanel expects.
 */
export async function buildContextMenuForActions({
  actions,
  title = defaultTitle,
  closeMenu = () => {},
  overlays,
}: BuildContextMenuParams): Promise<EuiContextMenuPanelDescriptor[]> {
  const panels: Record<string, PanelDescriptor> = {
    mainMenu: {
      id: 'mainMenu',
      title,
      items: [],
    },
  };
  const additionalContextMenuDatas: ActionContextMenuData[] = [];
  const promises = actions.map(async (item) => {
    const { action } = item;
    const context: ActionExecutionContext<object> = { ...item.context, trigger: item.trigger };
    const isCompatible = await item.action.isCompatible(context);
    // For some actions, the data is contained within action.definition
    const getContextMenuData: GetContextMenuDataType =
      action.getContextMenuData || action.definition?.getContextMenuData;

    if (!isCompatible) return;

    // Exit early if getContextMenuData provided, which will handle all menu data for this action
    if (getContextMenuData) {
      additionalContextMenuDatas.push(getContextMenuData({ context, overlays, closeMenu }));
      return;
    }

    let parentPanel = '';
    let currentPanel = '';
    if (action.grouping) {
      for (let i = 0; i < action.grouping.length; i++) {
        const group = action.grouping[i];
        currentPanel = group.id;
        if (!panels[currentPanel]) {
          const name = group.getDisplayName ? group.getDisplayName(context) : group.id;
          panels[currentPanel] = {
            id: currentPanel,
            title: name,
            items: [],
            _level: i,
            _icon: group.getIconType ? group.getIconType(context) : 'empty',
          };
          if (parentPanel) {
            panels[parentPanel].items!.push({
              name,
              panel: currentPanel,
              icon: group.getIconType ? group.getIconType(context) : 'empty',
              _order: group.order || 0,
              _title: group.getDisplayName ? group.getDisplayName(context) : '',
            });
          }
        }
        parentPanel = currentPanel;
      }
    }
    panels[parentPanel || 'mainMenu'].items!.push({
      name: action.MenuItem
        ? React.createElement(uiToReactComponent(action.MenuItem), { context })
        : action.getDisplayName(context),
      icon: action.getIconType(context),
      'data-test-subj': `embeddablePanelAction-${action.id}`,
      onClick: onClick(action, context, closeMenu),
      href: action.getHref ? await action.getHref(context) : undefined,
      _order: action.order || 0,
      _title: action.getDisplayName(context),
    });
  });
  await Promise.all(promises);

  for (const panel of Object.values(panels)) {
    const items = panel.items.filter(Boolean) as ItemDescriptor[];
    panel.items = _.sortBy(
      items,
      (a) => -1 * (a._order ?? 0),
      (a) => a._title
    );
  }

  wrapMainPanelItemsIntoSubmenu(panels, 'mainMenu');

  for (const panel of Object.values(panels)) {
    if (panel._level === 0) {
      // TODO: Add separator line here once it is available in EUI.
      // See https://github.com/elastic/eui/pull/4018
      if (panel.items.length > 3) {
        panels.mainMenu.items.push({
          name: panel.title || panel.id,
          icon: panel._icon || 'empty',
          panel: panel.id,
        });
      } else {
        panels.mainMenu.items.push(...panel.items);
      }
    }
  }

  // This holds all panels for the final context menu
  const panelList = removePanelMetaFields(Object.values(panels));

  if (!additionalContextMenuDatas.length) {
    return panelList;
  }

  // Add additional panels
  additionalContextMenuDatas.forEach((additionalContextMenuData: ActionContextMenuData) => {
    panelList.push(...(additionalContextMenuData.additionalPanels || []));
  });

  // Start to build the items for the intial panel...
  // First, create an array to store all groups
  let firstPanelItemsGroups: ActionContextMenuDataFirstPanelGroup[] = [];

  // Add group for existing panel of items. This is the default group.
  firstPanelItemsGroups.push({
    name: 'default',
    order: 0,
    items: panelList[0].items || [],
  });

  // Add groups from additionalContextMenuDatas
  additionalContextMenuDatas.forEach((additionalContextMenuData: ActionContextMenuData) => {
    firstPanelItemsGroups.push(...(additionalContextMenuData.additionalFirstPanelGroups || []));
  });

  // For each group...combine groups that have the same name.
  // Note: the `order` and `isTitleVisible` properties are not taken into
  // account to determine if a group is the same.
  firstPanelItemsGroups = firstPanelItemsGroups.reduce(
    (
      newGroups: ActionContextMenuDataFirstPanelGroup[],
      currentGroup: ActionContextMenuDataFirstPanelGroup
    ) => {
      const { name = 'default', items = [] } = currentGroup;

      const indexOfAlreadyAddedMatch = newGroups.findIndex(
        (matchingGroup: ActionContextMenuDataFirstPanelGroup) => matchingGroup.name === name
      );

      if (indexOfAlreadyAddedMatch === -1) {
        // If no match, add to newGroups
        newGroups.push(currentGroup);
      } else {
        // Group exists already, so add items to matching group
        newGroups[indexOfAlreadyAddedMatch].items.push(...items);
      }

      return newGroups;
    },
    []
  );

  // Sort groups based on order...higher order goes first
  firstPanelItemsGroups.sort((a, b) => (b.order || 0) - (a.order || 0));

  // For each group...add separators, title, and items
  const firstPanelItems: any[] = firstPanelItemsGroups.reduce(
    (newItems: any[], currentGroup: ActionContextMenuDataFirstPanelGroup, index) => {
      const { name = 'default', items = [], isTitleVisible } = currentGroup;

      // If after first group, add separator before this group's items
      if (index > 0 && items.length > 0) {
        newItems.push({ isSeparator: true, key: `sep-before-${index}` });
      }

      // Add title if needed
      if (isTitleVisible) {
        newItems.push({
          name: (
            <EuiText color="success" className="build_eui_context_menu_panels__title-text">
              <h5>{name}</h5>
            </EuiText>
          ),
          className: 'build_eui_context_menu_panels__no-action',
        });
      }

      // Add items
      newItems.push(...items);

      return newItems;
    },
    []
  );

  panelList[0].items = firstPanelItems;

  return panelList;
}
