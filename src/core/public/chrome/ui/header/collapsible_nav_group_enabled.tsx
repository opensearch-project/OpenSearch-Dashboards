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
import { WorkspacesStart } from 'src/core/public/workspace';
import { ChromeNavControl, ChromeNavLink } from '../..';
import { AppCategory, NavGroupStatus } from '../../../../types';
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
import { ALL_USE_CASE_ID, DEFAULT_APP_CATEGORIES } from '../../../../../core/utils';
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
  capabilities: InternalApplicationStart['capabilities'];
  currentWorkspace$: WorkspacesStart['currentWorkspace$'];
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

const LEVEL_FOR_ROOT_ITEMS = 1;

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
      return {
        id: navLink.category?.id ?? '',
        name: <div className="nav-link-item">{navLink.category?.label ?? ''}</div>,
        items: navLink.links?.map((link) => createSideNavItem(link, level + 1)),
        'aria-label': navLink.category?.label,
      };
    }

    return {} as EuiSideNavItemType<{}>;
  };
  const orderedLinksOrCategories = getOrderedLinksOrCategories(navLinks);
  const sideNavItems = orderedLinksOrCategories
    .map((navLink) => createSideNavItem(navLink, LEVEL_FOR_ROOT_ITEMS))
    .filter((item): item is EuiSideNavItemType<{}> => !!item);
  return (
    <EuiFlexItem style={style}>
      <EuiSideNav items={sideNavItems} isOpenOnMobile />
      {suffix}
    </EuiFlexItem>
  );
}

// Custom category is used for those features not belong to any of use cases in all use case.
// and the custom category should always sit before manage category
const customCategory: AppCategory = {
  id: 'custom',
  label: i18n.translate('core.ui.customNavList.label', { defaultMessage: 'Custom' }),
  order: (DEFAULT_APP_CATEGORIES.manage.order || 0) - 500,
};

enum NavWidth {
  Expanded = 270,
  Collapsed = 48, // The Collasped width is supposed to be aligned with the hamburger icon on the top left navigation.
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
  capabilities,
  ...observables
}: CollapsibleNavGroupEnabledProps) {
  const allNavLinks = useObservable(observables.navLinks$, []);
  const navLinks = allNavLinks.filter((link) => !link.hidden);
  const homeLink = useMemo(() => allNavLinks.find((item) => item.id === 'home'), [allNavLinks]);
  const appId = useObservable(observables.appId$, '');
  const navGroupsMap = useObservable(observables.navGroupsMap$, {});
  const currentNavGroup = useObservable(observables.currentNavGroup$, undefined);
  const firstVisibleNavLinkOfAllUseCase = useMemo(
    () =>
      fulfillRegistrationLinksToChromeNavLinks(
        navGroupsMap[ALL_USE_CASE_ID]?.navLinks || [],
        navLinks
      )[0],
    [navGroupsMap, navLinks]
  );

  const visibleUseCases = useMemo(
    () =>
      Object.values(navGroupsMap).filter(
        (group) => group.type === undefined && group.status !== NavGroupStatus.Hidden
      ),
    [navGroupsMap]
  );

  const navLinksForRender: ChromeNavLink[] = useMemo(() => {
    if (currentNavGroup && currentNavGroup.id !== ALL_USE_CASE_ID) {
      return fulfillRegistrationLinksToChromeNavLinks(
        navGroupsMap[currentNavGroup.id].navLinks || [],
        navLinks
      );
    }

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
        navLinksForAll.push({
          ...navLink,
          category: customCategory,
        });
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
        const linksForAllUseCaseWithinNavGroup = fulfillRegistrationLinksToChromeNavLinks(
          group.navLinks,
          navLinks
        )
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
        } else {
          /**
           * Find if there are any links inside a use case but without a `see all` entry.
           * If so, append these features into custom category as a fallback
           */
          fulfillRegistrationLinksToChromeNavLinks(group.navLinks, navLinks)
            // Filter out links that already exists in all use case
            .filter(
              (navLink) => !navLinksForAll.find((navLinkInAll) => navLinkInAll.id === navLink.id)
            )
            .forEach((navLink) => {
              navLinksForAll.push({
                ...navLink,
                category: customCategory,
              });
            });
        }
      });

    return fulfillRegistrationLinksToChromeNavLinks(navLinksForAll, navLinks);
  }, [navLinks, navGroupsMap, currentNavGroup, visibleUseCases]);

  const width = useMemo(() => {
    if (!isNavOpen) {
      return NavWidth.Collapsed;
    }

    return NavWidth.Expanded;
  }, [isNavOpen]);

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
      ownFocus={false}
    >
      <div className="eui-fullHeight left-navigation-wrapper">
        {!isNavOpen ? null : (
          <EuiPanel
            hasBorder={false}
            borderRadius="none"
            paddingSize={!isNavOpen ? 's' : 'l'}
            hasShadow={false}
            style={{ flexGrow: 0, paddingBottom: 0 }}
          >
            <CollapsibleNavTop
              homeLink={homeLink}
              firstVisibleNavLinkOfAllUseCase={firstVisibleNavLinkOfAllUseCase}
              navigateToApp={navigateToApp}
              logos={logos}
              setCurrentNavGroup={setCurrentNavGroup}
              currentNavGroup={currentNavGroup}
              shouldShrinkNavigation={!isNavOpen}
              onClickShrink={closeNav}
              visibleUseCases={visibleUseCases}
              currentWorkspace$={observables.currentWorkspace$}
            />
          </EuiPanel>
        )}
        {!isNavOpen ? null : (
          <EuiPanel
            hasBorder={false}
            borderRadius="none"
            paddingSize={!isNavOpen ? 's' : 'l'}
            hasShadow={false}
            className="eui-yScroll flex-1-container"
          >
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
          </EuiPanel>
        )}
        {
          // This element is used to push icons to the bottom of left navigation when collapsed
          !isNavOpen ? <div className="flex-1-container" /> : null
        }
        <EuiHorizontalRule margin="none" />
        <div
          className={classNames({
            'bottom-container': true,
            'bottom-container-collapsed': !isNavOpen,
            'bottom-container-expanded': isNavOpen,
          })}
        >
          <HeaderNavControls
            navControls$={observables.navControlsLeftBottom$}
            className={classNames({ 'nav-controls-padding': isNavOpen })}
          />
        </div>
      </div>
    </EuiFlyout>
  );
}
