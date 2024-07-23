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

import {
  EuiHeader,
  EuiHeaderProps,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderSectionItemButton,
  EuiHideFor,
  EuiIcon,
  EuiShowFor,
  EuiToolTip,
  htmlIdGenerator,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classnames from 'classnames';
import React, { createRef, useMemo, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import { LoadingIndicator } from '../';
import {
  ChromeBadge,
  ChromeBreadcrumb,
  ChromeNavControl,
  ChromeNavLink,
  ChromeRecentlyAccessedHistoryItem,
} from '../..';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import {
  ChromeHelpExtension,
  ChromeBranding,
  ChromeBreadcrumbEnricher,
} from '../../chrome_service';
import { OnIsLockedUpdate } from './';
import { CollapsibleNav } from './collapsible_nav';
import { HeaderBadge } from './header_badge';
import { HeaderBreadcrumbs } from './header_breadcrumbs';
import { HeaderHelpMenu } from './header_help_menu';
import { HomeLoader } from './home_loader';
import { HeaderNavControls } from './header_nav_controls';
import { HeaderActionMenu } from './header_action_menu';
import { HeaderLogo } from './header_logo';
import type { Logos } from '../../../../common/types';
import { ISidecarConfig, getOsdSidecarPaddingStyle } from '../../../overlays';
import { CollapsibleNavGroupEnabled } from './collapsible_nav_group_enabled';
import { ChromeNavGroupServiceStartContract, NavGroupItemInMap } from '../../nav_group';
import { RecentItems } from './recent_items';
import { WorkspaceObject } from '../../../../public/workspace';

export interface HeaderProps {
  opensearchDashboardsVersion: string;
  application: InternalApplicationStart;
  appTitle$: Observable<string>;
  badge$: Observable<ChromeBadge | undefined>;
  breadcrumbs$: Observable<ChromeBreadcrumb[]>;
  breadcrumbsEnricher$: Observable<ChromeBreadcrumbEnricher | undefined>;
  collapsibleNavHeaderRender?: () => JSX.Element | null;
  customNavLink$: Observable<ChromeNavLink | undefined>;
  homeHref: string;
  isVisible$: Observable<boolean>;
  opensearchDashboardsDocLink: string;
  navLinks$: Observable<ChromeNavLink[]>;
  recentlyAccessed$: Observable<ChromeRecentlyAccessedHistoryItem[]>;
  forceAppSwitcherNavigation$: Observable<boolean>;
  helpExtension$: Observable<ChromeHelpExtension | undefined>;
  helpSupportUrl$: Observable<string>;
  navControlsLeft$: Observable<readonly ChromeNavControl[]>;
  navControlsCenter$: Observable<readonly ChromeNavControl[]>;
  navControlsRight$: Observable<readonly ChromeNavControl[]>;
  navControlsExpandedCenter$: Observable<readonly ChromeNavControl[]>;
  navControlsExpandedRight$: Observable<readonly ChromeNavControl[]>;
  navControlsLeftBottom$: Observable<readonly ChromeNavControl[]>;
  basePath: HttpStart['basePath'];
  isLocked$: Observable<boolean>;
  loadingCount$: ReturnType<HttpStart['getLoadingCount$']>;
  onIsLockedUpdate: OnIsLockedUpdate;
  branding: ChromeBranding;
  logos: Logos;
  survey: string | undefined;
  sidecarConfig$: Observable<ISidecarConfig | undefined>;
  navGroupEnabled: boolean;
  currentNavGroup$: Observable<NavGroupItemInMap | undefined>;
  navGroupsMap$: Observable<Record<string, NavGroupItemInMap>>;
  setCurrentNavGroup: ChromeNavGroupServiceStartContract['setCurrentNavGroup'];
  workspaceList$: Observable<WorkspaceObject[]>;
}

export function Header({
  opensearchDashboardsVersion,
  opensearchDashboardsDocLink,
  application,
  basePath,
  onIsLockedUpdate,
  homeHref,
  branding,
  survey,
  logos,
  collapsibleNavHeaderRender,
  navGroupEnabled,
  setCurrentNavGroup,
  ...observables
}: HeaderProps) {
  const isVisible = useObservable(observables.isVisible$, false);
  const isLocked = useObservable(observables.isLocked$, false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const sidecarConfig = useObservable(observables.sidecarConfig$, undefined);

  const sidecarPaddingStyle = useMemo(() => {
    return getOsdSidecarPaddingStyle(sidecarConfig);
  }, [sidecarConfig]);

  if (!isVisible) {
    return <LoadingIndicator loadingCount$={observables.loadingCount$} showAsBar />;
  }

  const toggleCollapsibleNavRef = createRef<HTMLButtonElement & { euiAnimate: () => void }>();
  const navId = htmlIdGenerator()();
  const className = classnames('hide-for-sharing', 'headerGlobalNav');
  const { useExpandedHeader = true } = branding;

  const expandedHeaderColorScheme: EuiHeaderProps['theme'] = 'dark';

  return (
    <>
      <header className={className} data-test-subj="headerGlobalNav">
        <div id="globalHeaderBars">
          {useExpandedHeader && (
            <EuiHeader
              className="expandedHeader"
              theme={expandedHeaderColorScheme}
              style={sidecarPaddingStyle}
              position="fixed"
              sections={[
                {
                  items: [
                    <HeaderLogo
                      href={homeHref}
                      forceNavigation$={observables.forceAppSwitcherNavigation$}
                      navLinks$={observables.navLinks$}
                      navigateToApp={application.navigateToApp}
                      branding={branding}
                      logos={logos}
                      /* This color-scheme should match the `theme` of the parent EuiHeader */
                      backgroundColorScheme={expandedHeaderColorScheme}
                    />,
                  ],
                  borders: 'none',
                },
                {
                  items: [
                    <EuiShowFor sizes={['m', 'l', 'xl']}>
                      <HeaderNavControls navControls$={observables.navControlsExpandedCenter$} />
                    </EuiShowFor>,
                  ],
                  borders: 'none',
                },
                {
                  items: [
                    <EuiHideFor sizes={['m', 'l', 'xl']}>
                      <HeaderNavControls navControls$={observables.navControlsExpandedCenter$} />
                    </EuiHideFor>,
                    <HeaderNavControls navControls$={observables.navControlsExpandedRight$} />,
                  ],
                  borders: 'none',
                },
              ]}
            />
          )}

          <EuiHeader position="fixed" className="primaryHeader" style={sidecarPaddingStyle}>
            <EuiHeaderSection grow={false}>
              <EuiHeaderSectionItem border="right" className="header__toggleNavButtonSection">
                <EuiToolTip
                  content={i18n.translate('core.ui.primaryNav.menu', {
                    defaultMessage: 'Menu',
                  })}
                  delay="long"
                  position="bottom"
                >
                  <EuiHeaderSectionItemButton
                    data-test-subj="toggleNavButton"
                    aria-label={i18n.translate('core.ui.primaryNav.toggleNavAriaLabel', {
                      defaultMessage: 'Toggle primary navigation',
                    })}
                    onClick={() => setIsNavOpen(!isNavOpen)}
                    aria-expanded={isNavOpen}
                    aria-pressed={isNavOpen}
                    aria-controls={navId}
                    ref={toggleCollapsibleNavRef}
                  >
                    <EuiIcon type="menu" size="m" />
                  </EuiHeaderSectionItemButton>
                </EuiToolTip>
              </EuiHeaderSectionItem>

              <EuiHeaderSectionItem border="right">
                <HeaderNavControls side="left" navControls$={observables.navControlsLeft$} />
              </EuiHeaderSectionItem>

              <EuiHeaderSectionItem border="right">
                <HomeLoader
                  href={homeHref}
                  forceNavigation$={observables.forceAppSwitcherNavigation$}
                  navLinks$={observables.navLinks$}
                  navigateToApp={application.navigateToApp}
                  branding={branding}
                  logos={logos}
                  loadingCount$={observables.loadingCount$}
                />
              </EuiHeaderSectionItem>
              {/* Only display recent items when navGroup is enabled */}
              {navGroupEnabled && (
                <EuiHeaderSectionItem border="right">
                  <RecentItems
                    recentlyAccessed$={observables.recentlyAccessed$}
                    workspaceList$={observables.workspaceList$}
                    navigateToUrl={application.navigateToUrl}
                    navLinks$={observables.navLinks$}
                    basePath={basePath}
                  />
                </EuiHeaderSectionItem>
              )}
            </EuiHeaderSection>

            <HeaderBreadcrumbs
              appTitle$={observables.appTitle$}
              breadcrumbs$={observables.breadcrumbs$}
              breadcrumbsEnricher$={observables.breadcrumbsEnricher$}
            />

            <EuiHeaderSectionItem border="none">
              <HeaderBadge badge$={observables.badge$} />
            </EuiHeaderSectionItem>

            <EuiHeaderSection side="right">
              <EuiHeaderSectionItem border="none">
                <HeaderActionMenu actionMenu$={application.currentActionMenu$} />
              </EuiHeaderSectionItem>

              <EuiHeaderSectionItem border="left">
                <HeaderNavControls navControls$={observables.navControlsCenter$} />
              </EuiHeaderSectionItem>

              <EuiHeaderSectionItem border="left">
                <HeaderNavControls side="right" navControls$={observables.navControlsRight$} />
              </EuiHeaderSectionItem>

              <EuiHeaderSectionItem border="left">
                <HeaderHelpMenu
                  helpExtension$={observables.helpExtension$}
                  helpSupportUrl$={observables.helpSupportUrl$}
                  opensearchDashboardsDocLink={opensearchDashboardsDocLink}
                  opensearchDashboardsVersion={opensearchDashboardsVersion}
                  surveyLink={survey}
                />
              </EuiHeaderSectionItem>
            </EuiHeaderSection>
          </EuiHeader>
        </div>

        {navGroupEnabled ? (
          <CollapsibleNavGroupEnabled
            appId$={application.currentAppId$}
            id={navId}
            isLocked={isLocked}
            navLinks$={observables.navLinks$}
            isNavOpen={isNavOpen}
            basePath={basePath}
            navigateToApp={application.navigateToApp}
            navigateToUrl={application.navigateToUrl}
            onIsLockedUpdate={onIsLockedUpdate}
            closeNav={() => {
              setIsNavOpen(false);
              if (toggleCollapsibleNavRef.current) {
                toggleCollapsibleNavRef.current.focus();
              }
            }}
            customNavLink$={observables.customNavLink$}
            logos={logos}
            navGroupsMap$={observables.navGroupsMap$}
            navControlsLeftBottom$={observables.navControlsLeftBottom$}
            currentNavGroup$={observables.currentNavGroup$}
            setCurrentNavGroup={setCurrentNavGroup}
            capabilities={application.capabilities}
          />
        ) : (
          <CollapsibleNav
            appId$={application.currentAppId$}
            collapsibleNavHeaderRender={collapsibleNavHeaderRender}
            id={navId}
            isLocked={isLocked}
            navLinks$={observables.navLinks$}
            recentlyAccessed$={observables.recentlyAccessed$}
            isNavOpen={isNavOpen}
            homeHref={homeHref}
            basePath={basePath}
            navigateToApp={application.navigateToApp}
            navigateToUrl={application.navigateToUrl}
            onIsLockedUpdate={onIsLockedUpdate}
            closeNav={() => {
              setIsNavOpen(false);
              if (toggleCollapsibleNavRef.current) {
                toggleCollapsibleNavRef.current.focus();
              }
            }}
            customNavLink$={observables.customNavLink$}
            logos={logos}
          />
        )}
      </header>
    </>
  );
}
