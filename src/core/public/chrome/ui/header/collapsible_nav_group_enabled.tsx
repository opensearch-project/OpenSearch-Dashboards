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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import { ChromeNavLink } from '../..';
import { ChromeNavGroup } from '../../../../types';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { OnIsLockedUpdate } from './';
import { createEuiListItem } from './nav_link';
import type { Logos } from '../../../../common/types';
import { CollapsibleNavHeaderRender } from '../../chrome_service';
import { ChromeRegistrationNavLink, NavGroupItemInMap } from '../../nav_group';
import {
  fulfillRegistrationLinksToChromeNavLinks,
  getOrderedLinksOrCategories,
  LinkItem,
  LinkItemType,
} from '../../utils';
import { ALL_USE_CASE_ID } from '../../../../../core/utils';
import { CollapsibleNavTop } from './collapsible_nav_group_enabled_top';

interface Props {
  appId$: InternalApplicationStart['currentAppId$'];
  basePath: HttpStart['basePath'];
  collapsibleNavHeaderRender?: CollapsibleNavHeaderRender;
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

function NavGroups({
  navLinks,
  suffix,
  style,
  appId,
  navigateToApp,
  onNavItemClick,
}: NavGroupsProps) {
  const createNavItem = ({ link }: { link: ChromeNavLink }): EuiSideNavItemType<{}> => {
    const euiListItem = createEuiListItem({
      link,
      appId,
      dataTestSubj: 'collapsibleNavAppLink',
      navigateToApp,
      onClick: (event) => {
        onNavItemClick(event, link);
      },
    });

    return {
      id: link.id,
      name: <EuiText>{link.title}</EuiText>,
      onClick: euiListItem.onClick,
      href: euiListItem.href,
      emphasize: euiListItem.isActive,
      className: 'nav-link-item',
      buttonClassName: 'nav-link-item-btn',
    };
  };
  const createSideNavItem = (navLink: LinkItem): EuiSideNavItemType<{}> => {
    if (navLink.itemType === LinkItemType.LINK) {
      if (navLink.link.title === titleForSeeAll) {
        const navItem = createNavItem({
          link: navLink.link,
        });

        return {
          ...navItem,
        };
      }

      return createNavItem({
        link: navLink.link,
      });
    }

    if (navLink.itemType === LinkItemType.PARENT_LINK && navLink.link) {
      return {
        ...createNavItem({ link: navLink.link }),
        items: navLink.links.map((subNavLink) => createSideNavItem(subNavLink)),
      };
    }

    if (navLink.itemType === LinkItemType.CATEGORY) {
      return {
        id: navLink.category?.id ?? '',
        name: <div className="nav-link-item">{navLink.category?.label ?? ''}</div>,
        items: navLink.links?.map((link) => createSideNavItem(link)),
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
  collapsibleNavHeaderRender,
  id,
  isLocked,
  isNavOpen,
  storage = window.localStorage,
  onIsLockedUpdate,
  closeNav,
  navigateToApp,
  navigateToUrl,
  logos,
  ...observables
}: Props) {
  const navLinks = useObservable(observables.navLinks$, []).filter((link) => !link.hidden);
  const appId = useObservable(observables.appId$, '');
  const navGroupsMap = useObservable(observables.navGroupsMap$, {});

  const [focusGroup, setFocusGroup] = useState<ChromeNavGroup | undefined>(undefined);

  // useEffect(() => {
  //   if (!focusGroup && appId) {
  //     const orderedGroups = sortBy(Object.values(navGroupsMap), (group) => group.order);
  //     const findMatchedGroup = orderedGroups.find(
  //       (group) => !!group.navLinks.find((navLink) => navLink.id === appId)
  //     );
  //     setFocusGroup(findMatchedGroup);
  //   }
  // }, [appId, navGroupsMap, focusGroup]);

  const onGroupClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    group: ChromeNavGroup
  ) => {
    const fulfilledLinks = fulfillRegistrationLinksToChromeNavLinks(
      navGroupsMap[group.id]?.navLinks,
      navLinks
    );
    setFocusGroup(group);

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
    if (focusGroup) {
      return fulfillRegistrationLinksToChromeNavLinks(
        navGroupsMap[focusGroup.id].navLinks || [],
        navLinks
      );
    }

    const navLinksForAll: ChromeRegistrationNavLink[] = [];
    navGroupsMap[ALL_USE_CASE_ID]?.navLinks.forEach((navLink) => {
      navLinksForAll.push(navLink);
    });

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
  }, [navLinks, navGroupsMap, focusGroup]);

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
      <div className="eui-fullHeight">
        <div className="eui-yScroll">
          <EuiPanel
            hasBorder={false}
            borderRadius="none"
            paddingSize={!isNavOpen ? 's' : 'l'}
            style={{ minHeight: '100%' }}
          >
            {!isNavOpen ? null : (
              <>
                <CollapsibleNavTop
                  navLinks={navLinks}
                  navGroupsMap={navGroupsMap}
                  navigateToApp={navigateToApp}
                  logos={logos}
                  onClickBack={() => setFocusGroup(undefined)}
                  focusGroup={focusGroup}
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
      </div>
    </EuiFlyout>
  );
}
