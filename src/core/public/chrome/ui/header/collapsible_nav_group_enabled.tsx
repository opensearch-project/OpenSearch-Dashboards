/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './collapsible_nav_group_enabled.scss';
import { EuiFlyout, EuiPanel, EuiHideFor, EuiFlyoutProps, EuiShowFor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import * as Rx from 'rxjs';
import classNames from 'classnames';
import { WorkspacesStart } from 'src/core/public/workspace';
import { NavGroupType } from '../../../../types';
import { ChromeNavControl, ChromeNavLink } from '../..';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { createEuiListItem } from './nav_link';
import type { Logos } from '../../../../common/types';
import {
  ChromeNavGroupServiceStartContract,
  ChromeRegistrationNavLink,
  NavGroupItemInMap,
} from '../../nav_group';
import { fulfillRegistrationLinksToChromeNavLinks, getVisibleUseCases, sortBy } from '../../utils';
import { ALL_USE_CASE_ID, DEFAULT_APP_CATEGORIES } from '../../../../../core/utils';
import { GlobalSearchCommand } from '../../global_search';
import { CollapsibleNavTop } from './collapsible_nav_group_enabled_top';
import { HeaderNavControls } from './header_nav_controls';
import { NavGroups } from './collapsible_nav_groups';
import { HeaderSearchBar, HeaderSearchBarIcon } from './header_search_bar';

export interface CollapsibleNavGroupEnabledProps {
  appId$: InternalApplicationStart['currentAppId$'];
  collapsibleNavHeaderRender?: () => JSX.Element | null;
  basePath: HttpStart['basePath'];
  id: string;
  isNavOpen: boolean;
  navLinks$: Rx.Observable<ChromeNavLink[]>;
  storage?: Storage;
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
  globalSearchCommands?: GlobalSearchCommand[];
}

const titleForSeeAll = i18n.translate('core.ui.primaryNav.seeAllLabel', {
  defaultMessage: 'See all...',
});

enum NavWidth {
  Expanded = 270,
  Collapsed = 48, // The Collapsed width is supposed to be aligned with the hamburger icon on the top left navigation.
}

export function CollapsibleNavGroupEnabled({
  basePath,
  id,
  isNavOpen,
  storage = window.localStorage,
  closeNav,
  navigateToApp,
  navigateToUrl,
  logos,
  setCurrentNavGroup,
  capabilities,
  collapsibleNavHeaderRender,
  globalSearchCommands,
  ...observables
}: CollapsibleNavGroupEnabledProps) {
  const allNavLinks = useObservable(observables.navLinks$, []);
  const navLinks = allNavLinks.filter((link) => !link.hidden);
  const homeLink = useMemo(() => allNavLinks.find((item) => item.id === 'home'), [allNavLinks]);
  const appId = useObservable(observables.appId$, '');
  const navGroupsMap = useObservable(observables.navGroupsMap$, {});
  const currentNavGroup = useObservable(observables.currentNavGroup$, undefined);
  const currentWorkspace = useObservable(observables.currentWorkspace$);

  const visibleUseCases = useMemo(() => getVisibleUseCases(navGroupsMap), [navGroupsMap]);

  const currentNavGroupId = useMemo(() => {
    if (!currentNavGroup) {
      if (visibleUseCases.length === 1) {
        return visibleUseCases[0].id;
      }

      if (!capabilities.workspaces.enabled) {
        return ALL_USE_CASE_ID;
      }
    }

    return currentNavGroup?.id;
  }, [capabilities, currentNavGroup, visibleUseCases]);

  const shouldAppendManageCategory = capabilities.workspaces.enabled
    ? !currentNavGroupId
    : currentNavGroupId === ALL_USE_CASE_ID;

  const navLinksForRender: ChromeNavLink[] = useMemo(() => {
    const getSystemNavGroups = () => {
      const result: ChromeNavLink[] = [];
      Object.values(navGroupsMap)
        .sort(sortBy('order'))
        .forEach((navGroup) => {
          if (navGroup.type !== NavGroupType.SYSTEM) {
            return;
          }
          const visibleNavLinksWithinNavGroup = fulfillRegistrationLinksToChromeNavLinks(
            navGroup.navLinks,
            navLinks
          );
          /**
           * We will take the first visible app inside the system nav groups
           * when customers click the menu. If there is not a visible nav links,
           * we should not show the nav group.
           */
          if (visibleNavLinksWithinNavGroup[0]) {
            result.push({
              ...visibleNavLinksWithinNavGroup[0],
              title: navGroup.title,
              category: DEFAULT_APP_CATEGORIES.manage,
            });
          }
        });

      return result;
    };

    const navLinksResult: ChromeRegistrationNavLink[] = [];

    if (currentNavGroupId) {
      navLinksResult.push(...(navGroupsMap[currentNavGroupId]?.navLinks || []));
    }

    if (shouldAppendManageCategory) {
      navLinksResult.push(...getSystemNavGroups());
    }

    return fulfillRegistrationLinksToChromeNavLinks(navLinksResult, navLinks);
  }, [navLinks, navGroupsMap, currentNavGroupId, shouldAppendManageCategory]);

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

  const rendeLeftNav = (props?: Partial<EuiFlyoutProps>) => (
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
      {...props}
    >
      <div className="eui-fullHeight left-navigation-wrapper">
        {!isNavOpen ? null : (
          <EuiPanel
            hasBorder={false}
            borderRadius="none"
            paddingSize="s"
            hasShadow={false}
            color="transparent"
            style={{ flexGrow: 0 }}
          >
            <CollapsibleNavTop
              homeLink={homeLink}
              collapsibleNavHeaderRender={collapsibleNavHeaderRender}
              navigateToApp={navigateToApp}
              logos={logos}
              currentNavGroup={currentNavGroupId ? navGroupsMap[currentNavGroupId] : undefined}
              shouldShrinkNavigation={!isNavOpen}
              onClickShrink={closeNav}
            />
          </EuiPanel>
        )}
        {!isNavOpen ? (
          <div className="searchBarIcon euiHeaderSectionItemButton">
            {globalSearchCommands && (
              <HeaderSearchBarIcon globalSearchCommands={globalSearchCommands} />
            )}
          </div>
        ) : (
          <EuiPanel
            hasBorder={false}
            paddingSize="s"
            hasShadow={false}
            className="searchBar-wrapper"
          >
            {globalSearchCommands && (
              <HeaderSearchBar globalSearchCommands={globalSearchCommands} />
            )}
          </EuiPanel>
        )}
        {!isNavOpen ? null : (
          <EuiPanel
            hasBorder={false}
            borderRadius="none"
            paddingSize={!isNavOpen ? 's' : 'm'}
            hasShadow={false}
            className="eui-yScroll flex-1-container"
            color="transparent"
            style={{ paddingTop: 0 }}
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
              categoryCollapsible={currentNavGroupId === ALL_USE_CASE_ID}
              currentWorkspaceId={currentWorkspace?.id}
            />
          </EuiPanel>
        )}
        {
          // This element is used to push icons to the bottom of left navigation when collapsed
          !isNavOpen ? <div className="flex-1-container" /> : null
        }
        <div
          className={classNames({
            'bottom-container': true,
            'eui-xScroll': isNavOpen,
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

  return (
    <>
      <EuiHideFor sizes={['xs', 's', 'm']}>{rendeLeftNav()}</EuiHideFor>
      {isNavOpen ? (
        <EuiShowFor sizes={['xs', 's', 'm']}>
          {rendeLeftNav({
            type: 'overlay',
            size: undefined,
            outsideClickCloses: true,
            paddingSize: undefined,
            ownFocus: true,
          })}
        </EuiShowFor>
      ) : null}
    </>
  );
}
