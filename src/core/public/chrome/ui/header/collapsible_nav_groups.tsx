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
  EuiFlexGroup,
  EuiIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import classNames from 'classnames';
import { ChromeNavLink } from '../..';
import { InternalApplicationStart } from '../../../application/types';
import { createEuiListItem } from './nav_link';
import {
  getIsCategoryOpen,
  getOrderedLinksOrCategories,
  LinkItem,
  LinkItemType,
  setIsCategoryOpen,
} from '../../utils';

export interface NavGroupsProps {
  navLinks: ChromeNavLink[];
  suffix?: React.ReactElement;
  style?: React.CSSProperties;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  onNavItemClick: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    navItem: ChromeNavLink
  ) => void;
  categoryCollapsible?: boolean;
  currentWorkspaceId?: string;
  storage?: Storage;
}

const titleForSeeAll = i18n.translate('core.ui.primaryNav.seeAllLabel', {
  defaultMessage: 'See all...',
});

const LEVEL_FOR_ROOT_ITEMS = 1;

export function NavGroups({
  navLinks,
  suffix,
  style,
  appId,
  navigateToApp,
  onNavItemClick,
  categoryCollapsible,
  currentWorkspaceId,
  storage = window.localStorage,
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
      onClick: (event) => {
        onNavItemClick(event, link);
      },
    });

    return {
      id: `${link.id}-${link.title}`,
      name: <EuiText size="xs">{link.title}</EuiText>,
      onClick: euiListItem.onClick,
      href: euiListItem.href,
      emphasize: euiListItem.isActive,
      className: `nav-link-item ${className || ''}`,
      buttonClassName: 'nav-link-item-btn',
      'data-test-subj': euiListItem['data-test-subj'],
      'aria-label': link.title,
    };
  };
  const createSideNavItem = (
    navLink: LinkItem,
    level: number,
    className?: string
  ): EuiSideNavItemType<{}> => {
    if (navLink.itemType === LinkItemType.LINK) {
      if (navLink.link.title === titleForSeeAll) {
        const navItem = createNavItem({
          link: navLink.link,
        });

        return {
          ...navItem,
          name: <EuiText color="success">{navItem.name}</EuiText>,
          emphasize: false,
        };
      }

      return createNavItem({
        link: navLink.link,
        className,
      });
    }

    if (navLink.itemType === LinkItemType.PARENT_LINK && navLink.link) {
      const props = createNavItem({ link: navLink.link });
      const parentItem = {
        ...props,
        forceOpen: true,
        /**
         * The href and onClick should both be undefined to make parent item rendered as accordion.
         */
        href: undefined,
        onClick: undefined,
        className: classNames(props.className, 'nav-link-parent-item'),
        buttonClassName: classNames(props.buttonClassName, 'nav-link-parent-item-button'),
        items: navLink.links.map((subNavLink) =>
          createSideNavItem(subNavLink, level + 1, 'nav-nested-item')
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
      const isCategoryOpen = categoryCollapsible
        ? getIsCategoryOpen(categoryOpenKey, storage, 'false')
        : true;
      return {
        id: navLink.category?.id ?? '',
        name: (
          <EuiFlexGroup
            alignItems="center"
            className={`nav-link-item${categoryCollapsible ? ' euiAccordion__button' : ''}`}
            gutterSize="none"
            onClick={() => {
              if (!categoryCollapsible) {
                return;
              }

              setIsCategoryOpen(categoryOpenKey, !isCategoryOpen, storage);
              // Trigger the element to rerender because `setIsCategoryOpen` is not updating component's state
              setRenderKey(Date.now());
            }}
          >
            <EuiFlexItem>
              <div>{navLink.category?.label ?? ''}</div>
            </EuiFlexItem>
            {categoryCollapsible ? (
              <EuiFlexItem grow={false}>
                <EuiIcon type={isCategoryOpen ? 'minus' : 'plus'} />
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        ),
        items: (isCategoryOpen ? navLink.links : [])?.map((link) =>
          createSideNavItem(link, level + 1)
        ),
        'aria-label': navLink.category?.label,
      };
    }

    return {} as EuiSideNavItemType<{}>;
  };
  const orderedLinksOrCategories = getOrderedLinksOrCategories(navLinks);
  const sideNavItems = orderedLinksOrCategories
    .map((navLink) => createSideNavItem(navLink, LEVEL_FOR_ROOT_ITEMS))
    .filter((navItem) => !!navItem.id);

  return (
    <EuiFlexItem style={style}>
      <EuiSideNav
        items={sideNavItems}
        isOpenOnMobile
        className={`categoryCollapsible-${!!categoryCollapsible}`}
      />
      {suffix}
    </EuiFlexItem>
  );
}
