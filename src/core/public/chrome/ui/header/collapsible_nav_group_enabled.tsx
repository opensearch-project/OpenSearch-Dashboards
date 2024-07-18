/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './collapsible_nav_group_enabled.scss';
import {
  EuiFlexItem,
  EuiFlyout,
  EuiSideNavItemType,
  EuiSideNav,
  EuiPanel,
  EuiText,
  EuiHorizontalRule,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import classNames from 'classnames';
import { ChromeNavControl, ChromeNavLink } from '../..';
import { NavGroupStatus } from '../../../../types';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { OnIsLockedUpdate } from './';
import { createEuiListItem } from './nav_link';
import type { Logos } from '../../../../common/types';
import {
  ChromeNavGroupServiceStartContract,
  ChromeRegistrationNavLink,
  NavGroupItemInMap,
} from '../../nav_group';
import {
  fulfillRegistrationLinksToChromeNavLinks,
  getOrderedLinksOrCategories,
  LinkItem,
  LinkItemType,
} from '../../utils';
import { ALL_USE_CASE_ID } from '../../../../../core/utils';
import { CollapsibleNavTop } from './collapsible_nav_group_enabled_top';
import { HeaderNavControls } from './header_nav_controls';

export interface CollapsibleNavGroupEnabledProps {
  appId$: InternalApplicationStart['currentAppId$'];
  basePath: HttpStart['basePath'];
  id: string;
  isLocked: boolean;
  isNavOpen: boolean;
  navLinks$: Rx.Observable<ChromeNavLink[]>;
  storage?: Storage;
  onIsLockedUpdate: OnIsLockedUpdate;
  closeNav: () => void;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  navigateToUrl: InternalApplicationStart['navigateToUrl'];
  customNavLink$: Rx.Observable<ChromeNavLink | undefined>;
  logos: Logos;
  navGroupsMap$: Rx.Observable<Record<string, NavGroupItemInMap>>;
  navControlsLeftBottom$: Rx.Observable<readonly ChromeNavControl[]>;
  currentNavGroup$: Rx.Observable<NavGroupItemInMap | undefined>;
  setCurrentNavGroup: ChromeNavGroupServiceStartContract['setCurrentNavGroup'];
}

interface NavGroupsProps {
  navLinks: ChromeNavLink[];
  suffix?: React.ReactElement;
  style?: React.CSSProperties;
  appId?: string;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  onNavItemClick: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    navItem: ChromeNavLink
  ) => void;
}

const titleForSeeAll = i18n.translate('core.ui.primaryNav.seeAllLabel', {
  defaultMessage: 'See all...',
});

export function NavGroups({
  navLinks,
  suffix,
  style,
  appId,
  navigateToApp,
  onNavItemClick,
}: NavGroupsProps) {
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
      name: <EuiText size="s">{link.title}</EuiText>,
      onClick: euiListItem.onClick,
      href: euiListItem.href,
      emphasize: euiListItem.isActive,
      className: `nav-link-item ${className || ''}`,
      buttonClassName: 'nav-link-item-btn',
      'data-test-subj': euiListItem['data-test-subj'],
      'aria-label': link.title,
    };
  };
  const createSideNavItem = (navLink: LinkItem, className?: string): EuiSideNavItemType<{}> => {
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
      return {
        ...createNavItem({ link: navLink.link }),
        forceOpen: true,
        items: navLink.links.map((subNavLink) => createSideNavItem(subNavLink, 'nav-nested-item')),
      };
    }

    if (navLink.itemType === LinkItemType.CATEGORY) {
      return {
        id: navLink.category?.id ?? '',
        name: <div className="nav-link-item">{navLink.category?.label ?? ''}</div>,
        items: navLink.links?.map((link) => createSideNavItem(link)),
        'aria-label': navLink.category?.label,
      };
    }

    return {} as EuiSideNavItemType<{}>;
  };
  const orderedLinksOrCategories = getOrderedLinksOrCategories(navLinks);
  const sideNavItems = orderedLinksOrCategories
    .map((navLink) => createSideNavItem(navLink))
    .filter((item): item is EuiSideNavItemType<{}> => !!item);
  return (
    <EuiFlexItem style={style}>
      <EuiSideNav items={sideNavItems} />
      {suffix}
    </EuiFlexItem>
  );
}

export function CollapsibleNavGroupEnabled({
  basePath,
  id,
  isLocked,
  isNavOpen,
  storage = window.localStorage,
  onIsLockedUpdate,
  closeNav,
  navigateToApp,
  navigateToUrl,
  logos,
  setCurrentNavGroup,
  ...observables
}: CollapsibleNavGroupEnabledProps) {
  const navLinks = useObservable(observables.navLinks$, []).filter((link) => !link.hidden);
  const appId = useObservable(observables.appId$, '');
  const navGroupsMap = useObservable(observables.navGroupsMap$, {});
  const currentNavGroup = useObservable(observables.currentNavGroup$, undefined);

  const onGroupClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    group: NavGroupItemInMap
  ) => {
    const fulfilledLinks = fulfillRegistrationLinksToChromeNavLinks(
      navGroupsMap[group.id]?.navLinks,
      navLinks
    );
    setCurrentNavGroup(group.id);

    // the `navGroupsMap[group.id]?.navLinks` has already been sorted
    const firstLink = fulfilledLinks[0];
    if (firstLink) {
      const propsForEui = createEuiListItem({
        link: firstLink,
        appId,
        dataTestSubj: 'collapsibleNavAppLink',
        navigateToApp,
      });
      propsForEui.onClick(e);
    }
  };

  const navLinksForRender: ChromeNavLink[] = useMemo(() => {
    if (currentNavGroup) {
      return fulfillRegistrationLinksToChromeNavLinks(
        navGroupsMap[currentNavGroup.id].navLinks || [],
        navLinks
      );
    }

    const visibleUseCases = Object.values(navGroupsMap).filter(
      (group) => group.type === undefined && group.status !== NavGroupStatus.Hidden
    );

    if (visibleUseCases.length === 1) {
      return fulfillRegistrationLinksToChromeNavLinks(
        navGroupsMap[visibleUseCases[0].id].navLinks || [],
        navLinks
      );
    }

    const navLinksForAll: ChromeRegistrationNavLink[] = [];

    // Append all the links that do not have use case info to keep backward compatible
    const linkIdsWithUseGroupInfo = Object.values(navGroupsMap).reduce((total, navGroup) => {
      return [...total, ...navGroup.navLinks.map((navLink) => navLink.id)];
    }, [] as string[]);
    navLinks
      .filter((link) => !linkIdsWithUseGroupInfo.includes(link.id))
      .forEach((navLink) => {
        navLinksForAll.push(navLink);
      });

    // Append all the links registered to all use case
    navGroupsMap[ALL_USE_CASE_ID]?.navLinks.forEach((navLink) => {
      navLinksForAll.push(navLink);
    });

    // Append use case section into left navigation
    Object.values(navGroupsMap)
      .filter((group) => !group.type)
      .forEach((group) => {
        const categoryInfo = {
          id: group.id,
          label: group.title,
          order: group.order,
        };
        const linksForAllUseCaseWithinNavGroup = group.navLinks
          .filter((navLink) => navLink.showInAllNavGroup)
          .map((navLink) => ({
            ...navLink,
            category: categoryInfo,
          }));

        navLinksForAll.push(...linksForAllUseCaseWithinNavGroup);

        if (linksForAllUseCaseWithinNavGroup.length) {
          navLinksForAll.push({
            id: group.navLinks[0].id,
            title: titleForSeeAll,
            order: Number.MAX_SAFE_INTEGER,
            category: categoryInfo,
          });
        }
      });

    return fulfillRegistrationLinksToChromeNavLinks(navLinksForAll, navLinks);
  }, [navLinks, navGroupsMap, currentNavGroup]);

  const width = useMemo(() => {
    if (!isNavOpen) {
      return 50;
    }

    return 270;
  }, [isNavOpen]);

  return (
    <EuiFlyout
      data-test-subj="collapsibleNav"
      id={id}
      side="left"
      aria-label={i18n.translate('core.ui.primaryNav.screenReaderLabel', {
        defaultMessage: 'Primary',
      })}
      type="push"
      onClose={closeNav}
      outsideClickCloses={false}
      className="context-nav-wrapper"
      size={width}
      closeButtonPosition="outside"
      hideCloseButton
      paddingSize="none"
    >
      <div className="eui-fullHeight left-navigation-wrapper">
        <div className="eui-yScroll scrollable-container">
          <EuiPanel
            hasBorder={false}
            borderRadius="none"
            paddingSize={!isNavOpen ? 's' : 'l'}
            style={{ minHeight: '100%' }}
            hasShadow={false}
          >
            {!isNavOpen ? null : (
              <>
                <CollapsibleNavTop
                  navLinks={navLinks}
                  navGroupsMap={navGroupsMap}
                  navigateToApp={navigateToApp}
                  logos={logos}
                  onClickBack={() => setCurrentNavGroup(undefined)}
                  currentNavGroup={currentNavGroup}
                  shouldShrinkNavigation={!isNavOpen}
                  onClickShrink={closeNav}
                />
                <NavGroups
                  navLinks={navLinksForRender}
                  navigateToApp={navigateToApp}
                  onNavItemClick={(event, navItem) => {
                    if (navItem.title === titleForSeeAll && navItem.category?.id) {
                      const navGroup = navGroupsMap[navItem.category.id];
                      onGroupClick(event, navGroup);
                    }
                  }}
                  appId={appId}
                />
              </>
            )}
          </EuiPanel>
        </div>
        <EuiHorizontalRule margin="none" />
        <div className="bottom-container" style={{ flexDirection: isNavOpen ? 'row' : 'column' }}>
          <HeaderNavControls
            navControls$={observables.navControlsLeftBottom$}
            className={classNames({ 'nav-controls-padding': isNavOpen })}
          />
        </div>
      </div>
    </EuiFlyout>
  );
}
