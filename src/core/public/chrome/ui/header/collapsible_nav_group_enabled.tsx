/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './collapsible_nav_group_enabled.scss';
import { EuiFlyout, EuiPanel, EuiHideFor, EuiFlyoutProps, EuiShowFor } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useLayoutEffect, useMemo } from 'react';
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
import { AppStatus, PublicAppInfo } from '../../../application/types';
import { OBSERVABILITY_NAV_SECTIONS, filterByInstalledApps } from './observability_nav_config';
import { ObservabilityExpandedNav } from './observability_expanded_nav';
import { ObservabilityCollapsedNav } from './observability_collapsed_nav';

const EMPTY_APP_MAP: ReadonlyMap<string, PublicAppInfo> = new Map();

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
  globalSearchCommands$: Rx.Observable<GlobalSearchCommand[]>;
  enableIconSideNav?: boolean;
  isLocked?: boolean;
  onIsLockedUpdate?: (isLocked: boolean) => void;
  openNav?: () => void;
  applications$?: Rx.Observable<ReadonlyMap<string, PublicAppInfo>>;
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
  enableIconSideNav,
  isLocked,
  onIsLockedUpdate,
  openNav,
  ...observables
}: CollapsibleNavGroupEnabledProps) {
  const allNavLinks = useObservable(observables.navLinks$, []);
  const navLinks = allNavLinks.filter((link) => !link.hidden);
  const homeLink = useMemo(() => allNavLinks.find((item) => item.id === 'home'), [allNavLinks]);
  const appId = useObservable(observables.appId$, '');
  const navGroupsMap = useObservable(observables.navGroupsMap$, {});
  const currentNavGroup = useObservable(observables.currentNavGroup$, undefined);
  const currentWorkspace = useObservable(observables.currentWorkspace$);
  const globalSearchCommands = useObservable(observables.globalSearchCommands$);

  // Filter hardcoded observability nav config against installed apps
  const registeredApps = useObservable(observables.applications$ ?? Rx.EMPTY, EMPTY_APP_MAP);
  const obsNavSections = useMemo(() => {
    if (!enableIconSideNav) return [];
    const accessibleIds = new Set<string>();
    registeredApps.forEach((app, appIdKey) => {
      if (app.status === AppStatus.accessible) {
        accessibleIds.add(appIdKey);
      }
    });
    const sections = filterByInstalledApps(OBSERVABILITY_NAV_SECTIONS, accessibleIds);
    // Inject custom onClick for dev_tools — opens as modal instead of page navigation
    for (const section of sections) {
      for (const item of section.items) {
        if (item.id === 'dev_tools') {
          item.onClick = () => document.dispatchEvent(new CustomEvent('osd:openDevToolsModal'));
        }
      }
    }
    return sections;
  }, [enableIconSideNav, registeredApps]);

  // Set CSS variable so app-wrapper and header can offset for the fixed sidebar.
  // Only active when enableIconSideNav is ON (two-div pattern).
  // When OFF, the original EuiFlyout handles layout push natively.
  //
  // The content margin snaps instantly (no CSS transition) to avoid expensive
  // per-frame relayout on heavy pages like Discover/Traces. The fixed-position
  // sidebar visually masks the content jump as it slides open/closed.
  useLayoutEffect(() => {
    if (!enableIconSideNav) return;
    const width = isNavOpen ? `${NavWidth.Expanded}px` : `${NavWidth.Collapsed}px`;
    document.documentElement.style.setProperty('--osd-sidebar-width', width);
    return () => {
      document.documentElement.style.removeProperty('--osd-sidebar-width');
    };
  }, [enableIconSideNav, isNavOpen]);

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

  // ── Original nav rendering (EuiFlyout push — used when enableIconSideNav is OFF) ──

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

  // ── Icon side nav rendering (two-div pattern — used when enableIconSideNav is ON) ──

  const dataState = isNavOpen ? 'expanded' : 'collapsed';

  const renderIconSideNavContent = () => (
    <div className="osd-sidebar-inner">
      <EuiPanel
        hasBorder={false}
        borderRadius="none"
        paddingSize="s"
        hasShadow={false}
        color="transparent"
        className="osd-sidebar-top-panel"
      >
        <CollapsibleNavTop
          homeLink={homeLink}
          collapsibleNavHeaderRender={collapsibleNavHeaderRender}
          navigateToApp={navigateToApp}
          logos={logos}
          currentNavGroup={currentNavGroupId ? navGroupsMap[currentNavGroupId] : undefined}
          shouldShrinkNavigation={!isNavOpen}
          onClickShrink={closeNav}
          onClickExpand={openNav}
          isLocked={isLocked}
          onIsLockedUpdate={onIsLockedUpdate}
          enableIconSideNav={enableIconSideNav}
          searchElement={
            globalSearchCommands ? (
              <HeaderSearchBarIcon globalSearchCommands={globalSearchCommands} />
            ) : undefined
          }
        />
      </EuiPanel>
      {/* Render both expanded and collapsed navs; CSS handles visibility + transitions */}
      <div
        className={classNames('eui-yScroll flex-1-container obs-nav-scroll-container', {
          'obs-nav-hidden': !isNavOpen,
        })}
      >
        <ObservabilityExpandedNav
          sections={obsNavSections}
          appId={appId}
          navigateToApp={navigateToApp}
          basePath={basePath}
        />
      </div>
      <div className={classNames('obsCollapsedNav-wrapper', { 'obs-nav-hidden': isNavOpen })}>
        <ObservabilityCollapsedNav
          sections={obsNavSections}
          appId={appId}
          navigateToApp={navigateToApp}
          basePath={basePath}
        />
      </div>
      {isNavOpen && (
        <div
          className={classNames({
            'bottom-container': true,
            'eui-xScroll': true,
            'bottom-container-expanded': true,
          })}
        >
          <HeaderNavControls
            navControls$={observables.navControlsLeftBottom$}
            className="nav-controls-padding"
          />
        </div>
      )}
    </div>
  );

  const renderDesktopIconSideNav = () => (
    <>
      <div className="osd-sidebar-gap" data-state={dataState} />
      <nav
        className="osd-sidebar"
        data-state={dataState}
        data-test-subj="collapsibleNav"
        id={id}
        aria-label={i18n.translate('core.ui.primaryNav.screenReaderLabel', {
          defaultMessage: 'Primary',
        })}
      >
        {renderIconSideNavContent()}
      </nav>
    </>
  );

  // Mobile: overlay flyout for icon side nav mode
  const renderMobileIconSideNav = () => (
    <EuiFlyout
      data-test-subj="collapsibleNav"
      id={id}
      side="left"
      aria-label={i18n.translate('core.ui.primaryNav.screenReaderLabel', {
        defaultMessage: 'Primary',
      })}
      type="overlay"
      onClose={closeNav}
      outsideClickCloses={true}
      className="context-nav-wrapper"
      size={NavWidth.Expanded}
      closeButtonPosition="outside"
      hideCloseButton
      paddingSize="none"
      ownFocus={true}
    >
      <div className="eui-fullHeight left-navigation-wrapper">
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
            shouldShrinkNavigation={false}
            onClickShrink={closeNav}
          />
        </EuiPanel>
        <EuiPanel hasBorder={false} paddingSize="s" hasShadow={false} className="searchBar-wrapper">
          {globalSearchCommands && <HeaderSearchBar globalSearchCommands={globalSearchCommands} />}
        </EuiPanel>
        <EuiPanel
          hasBorder={false}
          borderRadius="none"
          paddingSize="m"
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
        <div
          className={classNames({
            'bottom-container': true,
            'eui-xScroll': true,
            'bottom-container-expanded': true,
          })}
        >
          <HeaderNavControls
            navControls$={observables.navControlsLeftBottom$}
            className="nav-controls-padding"
          />
        </div>
      </div>
    </EuiFlyout>
  );

  // ── Render ──

  if (enableIconSideNav) {
    return (
      <>
        <EuiHideFor sizes={['xs', 's', 'm']}>{renderDesktopIconSideNav()}</EuiHideFor>
        {isNavOpen ? (
          <EuiShowFor sizes={['xs', 's', 'm']}>{renderMobileIconSideNav()}</EuiShowFor>
        ) : null}
      </>
    );
  }

  // Default: original EuiFlyout-based nav
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
