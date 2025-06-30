/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './collapsible_nav_group_enabled.scss';
import {
  EuiFlexItem,
  EuiSideNavItemType,
  EuiSideNav,
  EuiText,
  EuiIcon,
  EuiPopoverTitle,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiTitle,
} from '@elastic/eui';
import React, { useState } from 'react';
import classNames from 'classnames';
import { ChromeNavLink } from '../..';
import { InternalApplicationStart } from '../../../application/types';
import { createEuiListItem } from './nav_link';
import { getOrderedLinksOrCategories, LinkItem, LinkItemType } from '../../utils';
import { CollapsibleNavGroupsLabel, getIsCategoryOpen } from './collapsible_nav_groups_label';
import { SimplePopover } from './hover_popover';

export interface NavGroupsProps {
  navLinks: ChromeNavLink[];
  style?: React.CSSProperties;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  categoryCollapsible?: boolean;
  currentWorkspaceId?: string;
  isNavOpen: boolean;
}

const LEVEL_FOR_ROOT_ITEMS = 1;

export function NavGroups({
  navLinks,
  style,
  appId,
  navigateToApp,
  categoryCollapsible,
  currentWorkspaceId,
  isNavOpen,
}: NavGroupsProps) {
  const [, setRenderKey] = useState(Date.now());
  const createNavItem = ({
    link,
    className,
  }: {
    link: ChromeNavLink;
    className?: string;
  }): EuiSideNavItemType<{}> => {
    const euiListItem = createEuiListItem({
      link,
      appId,
      dataTestSubj: `collapsibleNavAppLink-${link.id}`,
      navigateToApp,
    });

    return {
      id: `${link.id}-${link.title}`,
      name: <EuiText>{link.title}</EuiText>,
      onClick: euiListItem.onClick,
      href: euiListItem.href,
      emphasize: euiListItem.isActive,
      className: `nav-link-item nav-link-item-active-${!!euiListItem.isActive} ${className || ''}`,
      buttonClassName: 'nav-link-item-btn',
      'data-test-subj': euiListItem['data-test-subj'],
      'aria-label': link.title,
      ...(link.euiIconType
        ? {
            icon: <EuiIcon className="leftNavMenuIcon" type={link.euiIconType} />,
          }
        : {}),
    };
  };
  const createSideNavItem = (
    navLink: LinkItem,
    level: number,
    className?: string,
    navOpen?: boolean
  ): EuiSideNavItemType<{}> & { hidden?: boolean } => {
    if (navLink.itemType === LinkItemType.LINK) {
      const result = createNavItem({
        link: navLink.link,
        className,
      });
      return {
        ...result,
        name: navOpen ? result.name : '',
        hidden: !navOpen && !navLink.link.euiIconType,
      };
    }

    if (navLink.itemType === LinkItemType.PARENT_LINK && navLink.link) {
      const props = createNavItem({ link: navLink.link });
      const parentOpenKey = `${currentWorkspaceId ? `${currentWorkspaceId}-` : ''}${
        navLink.link.id
      }`;
      const content = (
        <CollapsibleNavGroupsLabel
          label={props.name}
          storageKey={parentOpenKey}
          collapsible
          onToggle={() => setRenderKey(Date.now())}
          data-test-subj={props['data-test-subj']}
        />
      );
      const parentItem = {
        ...props,
        forceOpen: true,
        /**
         * The Tree component inside SideNav is not a controllable component,
         * so we need to change the id(will pass as key into the Tree component) to remount the component.
         */
        id: `${props.id}-${!!getIsCategoryOpen(parentOpenKey)}`,
        /**
         * The href and onClick should both be undefined to make parent item rendered as accordion.
         */
        href: undefined,
        onClick: undefined,
        /**
         * The data-test-subj has to be undefined because we render the element with the attribute in CollapsibleNavGroupsLabel
         */
        'data-test-subj': undefined,
        className: classNames(props.className, 'nav-link-parent-item'),
        name: content,
        items: (getIsCategoryOpen(parentOpenKey) && navOpen
          ? navLink.links
          : []
        ).map((subNavLink) => createSideNavItem(subNavLink, level + 1, 'nav-nested-item', navOpen)),
        hidden: !navOpen && !navLink.link.euiIconType,
        icon: navOpen ? (
          props.icon
        ) : (
          <SimplePopover
            anchorPosition="upLeft"
            panelPaddingSize="none"
            button={props.icon || <></>}
            triggerType="hover"
          >
            <EuiPopoverTitle>
              <EuiTitle size="s">
                <span>{navLink.link?.title}</span>
              </EuiTitle>
            </EuiPopoverTitle>
            <EuiContextMenuPanel
              hasFocus={false}
              size="s"
              items={navLink.links.map((link) => {
                const subNavLink = createSideNavItem(link, level + 1, undefined, true);
                return (
                  <EuiContextMenuItem
                    onClick={subNavLink.onClick as (event: React.MouseEvent) => void}
                  >
                    {subNavLink.name}
                  </EuiContextMenuItem>
                );
              })}
            />
          </SimplePopover>
        ),
      };
      /**
       * OuiSideBar will never render items of first level as accordion,
       * in order to display accordion, we need to render a fake parent item.
       */
      if (level === LEVEL_FOR_ROOT_ITEMS) {
        return {
          className: 'nav-link-fake-item',
          buttonClassName: 'nav-link-fake-item-button',
          name: '',
          items: [parentItem],
          id: `fake_${props.id}`,
        };
      }

      return parentItem;
    }

    if (navLink.itemType === LinkItemType.CATEGORY) {
      const categoryOpenKey = `${currentWorkspaceId ? `${currentWorkspaceId}-` : ''}${
        navLink.category?.id
      }`;
      const items = (!categoryCollapsible || getIsCategoryOpen(categoryOpenKey)
        ? navLink.links
        : []
      )
        ?.map((link) => createSideNavItem(link, level + 1, undefined, navOpen))
        .filter((link) => !link.hidden);
      return {
        id: navLink.category?.id ?? '',
        name: navOpen ? (
          <CollapsibleNavGroupsLabel
            label={
              <EuiText size="s">
                <span className="euiCollapsibleNavGroup__heading nav-link-item">
                  {navLink.category?.label ?? ''}
                </span>
              </EuiText>
            }
            collapsible={!!categoryCollapsible}
            storageKey={categoryOpenKey}
            onToggle={() => setRenderKey(Date.now())}
          />
        ) : (
          <></>
        ),
        items,
        'aria-label': navLink.category?.label,
        className: 'nav-link-item-category-item',
        buttonClassName: 'nav-link-item-category-button',
        hidden: !navOpen && !items?.length,
      };
    }

    return {} as EuiSideNavItemType<{}>;
  };
  const orderedLinksOrCategories = getOrderedLinksOrCategories(navLinks);
  const sideNavItems = orderedLinksOrCategories
    .map((navLink) => createSideNavItem(navLink, LEVEL_FOR_ROOT_ITEMS, undefined, isNavOpen))
    .filter((navItem) => !!navItem.id && !navItem.hidden);

  return (
    <EuiFlexItem style={style}>
      <EuiSideNav
        items={sideNavItems}
        isOpenOnMobile
        mobileBreakpoints={[]}
        className="leftNavSideNavWrapper"
      />
    </EuiFlexItem>
  );
}
