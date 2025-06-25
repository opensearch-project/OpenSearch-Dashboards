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
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeader,
  EuiHeaderProps,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderSectionItemButton,
  EuiHeaderSectionItemButtonProps,
  EuiHideFor,
  EuiIcon,
  EuiShowFor,
  EuiTitle,
  htmlIdGenerator,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import classnames from 'classnames';
import React, { createRef, useCallback, useMemo, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import { InjectedMetadataStart } from '../../../injected_metadata';
import { LoadingIndicator } from '../';
import {
  ChromeBadge,
  ChromeBreadcrumb,
  ChromeNavControl,
  ChromeNavLink,
  ChromeRecentlyAccessedHistoryItem,
  HeaderVariant,
} from '../..';
import type { Logos } from '../../../../common/types';
import { WorkspaceObject, WorkspacesStart } from '../../../../public/workspace';
import { InternalApplicationStart } from '../../../application/types';
import { HttpStart } from '../../../http';
import { useObservableValue } from '../../../utils';
import {
  getOsdSidecarPaddingStyle,
  ISidecarConfig,
  getSidecarLeftNavStyle,
} from '../../../overlays';
import {
  ChromeBranding,
  ChromeBreadcrumbEnricher,
  ChromeHelpExtension,
} from '../../chrome_service';
import { ChromeNavGroupServiceStartContract, NavGroupItemInMap } from '../../nav_group';
import { OnIsLockedUpdate } from './';
import { CollapsibleNav } from './collapsible_nav';
import { CollapsibleNavGroupEnabled } from './collapsible_nav_group_enabled';
import './header.scss';
import { HeaderActionMenu } from './header_action_menu';
import { HeaderBadge } from './header_badge';
import { HeaderBreadcrumbs } from './header_breadcrumbs';
import { HeaderControlsContainer } from './header_controls_container';
import { HeaderHelpMenu } from './header_help_menu';
import { HeaderLogo } from './header_logo';
import { HeaderNavControls } from './header_nav_controls';
import { HomeLoader } from './home_loader';
import { RecentItems } from './recent_items';
import { GlobalSearchCommand } from '../../global_search';

export interface HeaderProps {
  http: HttpStart;
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
  headerVariant$: Observable<HeaderVariant | undefined>;
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
  navControlsPrimaryHeaderRight$: Observable<readonly ChromeNavControl[]>;
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
  currentWorkspace$: WorkspacesStart['currentWorkspace$'];
  useUpdatedHeader?: boolean;
  globalSearchCommands?: GlobalSearchCommand[];
  injectedMetadata?: InjectedMetadataStart;
}

const hasValue = (value: any) => {
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }

  return Boolean(value);
};

export function Header({
  http,
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
  useUpdatedHeader,
  globalSearchCommands,
  injectedMetadata,
  ...observables
}: HeaderProps) {
  const isVisible = useObservable(observables.isVisible$, false);
  const headerVariant = useObservable(observables.headerVariant$, HeaderVariant.PAGE);
  const isLocked = useObservable(observables.isLocked$, false);
  const [isNavOpenState, setIsNavOpenState] = useState(false);
  const sidecarConfig = useObservable(observables.sidecarConfig$, undefined);
  const breadcrumbs = useObservable(observables.breadcrumbs$, []);

  const currentLeftControls = useObservableValue(application.currentLeftControls$);
  const navControlsLeft = useObservable(observables.navControlsLeft$);

  const currentCenterControls = useObservableValue(application.currentCenterControls$);
  const navControlsExpandedCenter = useObservable(observables.navControlsExpandedCenter$);
  const navControlsCenter = useObservable(observables.navControlsCenter$);

  const currentRightControls = useObservableValue(application.currentRightControls$);
  const navControlsExpandedRight = useObservable(observables.navControlsExpandedRight$);
  const navControlsRight = useObservable(observables.navControlsRight$);

  const currentActionMenu = useObservableValue(application.currentActionMenu$);

  const currentBadgeControls = useObservableValue(application.currentBadgeControls$);
  const observableBadge = useObservable(observables.badge$);

  const sidecarPaddingStyle = useMemo(() => {
    return getOsdSidecarPaddingStyle(sidecarConfig);
  }, [sidecarConfig]);

  const sidecarLeftNavStyle = useMemo(() => {
    return getSidecarLeftNavStyle(sidecarConfig);
  }, [sidecarConfig]);

  const isNavOpen = useUpdatedHeader ? isLocked : isNavOpenState;

  const setIsNavOpen = useCallback(
    (value) => {
      /**
       * When use updated header, we will regard the lock state as source of truth
       */
      if (useUpdatedHeader) {
        onIsLockedUpdate(value);
      } else {
        setIsNavOpenState(value);
      }
    },
    [setIsNavOpenState, onIsLockedUpdate, useUpdatedHeader]
  );

  if (!isVisible) {
    return <LoadingIndicator loadingCount$={observables.loadingCount$} showAsBar />;
  }

  const toggleCollapsibleNavRef = createRef<HTMLButtonElement & { euiAnimate: () => void }>();
  const navId = htmlIdGenerator()();
  const className = classnames('hide-for-sharing', 'headerGlobalNav');
  const { useExpandedHeader = true } = branding;
  const useApplicationHeader = headerVariant === HeaderVariant.APPLICATION;

  const expandedHeaderColorScheme: EuiHeaderProps['theme'] = 'dark';

  const renderLegacyExpandedHeader = () => (
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
            <EuiShowFor sizes={['m', 'l', 'xl', 'xxl', 'xxxl']}>
              <HeaderNavControls navControls$={observables.navControlsExpandedCenter$} />
            </EuiShowFor>,
          ],
          borders: 'none',
        },
        {
          items: [
            <EuiHideFor sizes={['m', 'l', 'xl', 'xxl', 'xxxl']}>
              <HeaderNavControls navControls$={observables.navControlsExpandedCenter$} />
            </EuiHideFor>,
            <HeaderNavControls navControls$={observables.navControlsExpandedRight$} />,
          ],
          borders: 'none',
        },
      ]}
    />
  );

  const renderBreadcrumbs = (renderFullLength?: boolean, hideTrailingSeparator?: boolean) => (
    <HeaderBreadcrumbs
      appTitle$={observables.appTitle$}
      breadcrumbs$={observables.breadcrumbs$}
      breadcrumbsEnricher$={observables.breadcrumbsEnricher$}
      useUpdatedHeader={useUpdatedHeader}
      renderFullLength={renderFullLength}
      hideTrailingSeparator={hideTrailingSeparator}
    />
  );

  const renderNavToggle = () => {
    const renderNavToggleWithExtraProps = (
      props: EuiHeaderSectionItemButtonProps & { isSmallScreen?: boolean }
    ) => {
      const { isSmallScreen, ...others } = props;
      return (
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
          {...others}
          className={classnames(
            useUpdatedHeader
              ? useApplicationHeader
                ? 'newAppTopNavExpander'
                : 'newPageTopNavExpander'
              : undefined,
            props.className
          )}
        >
          {props.isSmallScreen ? (
            /**
             * Using <EuiButtonIcon type="base" /> here will introduce a warning in console
             * because button can not be a child of a button. In order to give the looks of a bordered icon,
             * here we use the classes to imitate the style
             */
            <span className="euiButtonIcon euiButtonIcon--subdued euiButtonIcon--xSmall ">
              <EuiIcon
                title={i18n.translate('core.ui.primaryNav.menu', {
                  defaultMessage: 'Menu',
                })}
                type="menu"
                size="s"
              />
            </span>
          ) : (
            <EuiIcon
              type="menu"
              size="m"
              title={i18n.translate('core.ui.primaryNav.menu', {
                defaultMessage: 'Menu',
              })}
            />
          )}
        </EuiHeaderSectionItemButton>
      );
    };
    return useUpdatedHeader ? (
      <>
        {isNavOpen
          ? null
          : renderNavToggleWithExtraProps({
              className: 'navToggleInLargeScreen eui-hideFor--xs eui-hideFor--s eui-hideFor--m',
              // Nav toggle button has a fixed position and its left size is 0 be default, it should have a left size if sidecar is docked to left.
              style: sidecarLeftNavStyle,
            })}
        {renderNavToggleWithExtraProps({
          flush: 'both',
          className:
            'navToggleInSmallScreen eui-hideFor--xl eui-hideFor--l eui-hideFor--xxl eui-hideFor--xxxl',
          isSmallScreen: true,
        })}
      </>
    ) : (
      renderNavToggleWithExtraProps({})
    );
  };

  const renderLeftControls = () => {
    const hasLeftControls = hasValue(currentLeftControls);
    const hasNavControlsLeft = hasValue(navControlsLeft);

    if (!hasLeftControls && !hasNavControlsLeft && useUpdatedHeader) {
      return null;
    }

    return (
      <>
        {useUpdatedHeader && (
          <EuiHeaderSectionItem border="none">
            <HeaderControlsContainer
              data-test-subj="headerLeftControl"
              controls$={application.currentLeftControls$}
            />
          </EuiHeaderSectionItem>
        )}

        {/* Nav controls left */}

        <EuiHeaderSectionItem border={useUpdatedHeader ? 'none' : 'right'}>
          <HeaderNavControls side="left" navControls$={observables.navControlsLeft$} />
        </EuiHeaderSectionItem>
      </>
    );
  };

  const renderCenterControls = () => {
    const hasCenterControls = hasValue(currentCenterControls);
    const hasNavControlsExpandedCenter = hasValue(navControlsExpandedCenter);
    const hasNavControlsCenter = hasValue(navControlsCenter);

    if (
      !hasCenterControls &&
      !hasNavControlsExpandedCenter &&
      !hasNavControlsCenter &&
      useUpdatedHeader
    ) {
      return null;
    }

    return (
      <>
        {useUpdatedHeader && (
          <EuiHeaderSectionItem border="none">
            <HeaderNavControls navControls$={observables.navControlsExpandedCenter$} />
          </EuiHeaderSectionItem>
        )}

        {useUpdatedHeader && (
          <EuiHeaderSectionItem border="none">
            <HeaderControlsContainer
              data-test-subj="headerCenterControl"
              controls$={application.currentCenterControls$}
            />
          </EuiHeaderSectionItem>
        )}

        <EuiHeaderSectionItem border={useUpdatedHeader ? 'none' : 'left'}>
          <HeaderNavControls navControls$={observables.navControlsCenter$} />
        </EuiHeaderSectionItem>
      </>
    );
  };

  const renderRightControls = () => {
    const hasNavControlsExpandedRight = hasValue(navControlsExpandedRight);
    const hasRightControls = hasValue(currentRightControls);
    const hasNavControlsRight = hasValue(navControlsRight);

    if (
      !hasRightControls &&
      !hasNavControlsExpandedRight &&
      !hasNavControlsRight &&
      useUpdatedHeader
    ) {
      return null;
    }

    return (
      <>
        {useUpdatedHeader && (
          <EuiHeaderSectionItem border="none">
            <HeaderNavControls navControls$={observables.navControlsExpandedRight$} />
          </EuiHeaderSectionItem>
        )}

        {useUpdatedHeader && (
          <EuiHeaderSectionItem border="none">
            <HeaderControlsContainer
              data-test-subj="headerRightControl"
              controls$={application.currentRightControls$}
            />
          </EuiHeaderSectionItem>
        )}

        <EuiHeaderSectionItem border={useUpdatedHeader ? 'none' : 'left'}>
          <HeaderNavControls side="right" navControls$={observables.navControlsRight$} />
        </EuiHeaderSectionItem>
      </>
    );
  };
  const renderActionMenu = () => {
    const hasActionMenu = hasValue(currentActionMenu);

    if (!hasActionMenu && useUpdatedHeader) {
      return null;
    }

    return (
      <EuiHeaderSectionItem border="none" className="headerAppActionMenuSection">
        <HeaderActionMenu actionMenu$={application.currentActionMenu$} />
      </EuiHeaderSectionItem>
    );
  };

  const renderBadge = () => {
    const hasBadge = hasValue(observableBadge);
    const hasCurrentBadgeControls = hasValue(currentBadgeControls);

    if (!hasBadge && !hasCurrentBadgeControls && useUpdatedHeader) {
      return null;
    }

    return (
      <>
        {useUpdatedHeader && (
          <EuiHeaderSectionItem border="none">
            <HeaderControlsContainer
              data-test-subj="headerBadgeControl"
              controls$={application.currentBadgeControls$}
            />
          </EuiHeaderSectionItem>
        )}

        {/* Nav controls badge */}
        <EuiHeaderSectionItem border="none">
          <HeaderBadge badge$={observables.badge$} />
        </EuiHeaderSectionItem>
      </>
    );
  };

  const renderHelp = () => (
    <EuiHeaderSectionItem border="left">
      <HeaderHelpMenu
        helpExtension$={observables.helpExtension$}
        helpSupportUrl$={observables.helpSupportUrl$}
        opensearchDashboardsDocLink={opensearchDashboardsDocLink}
        opensearchDashboardsVersion={opensearchDashboardsVersion}
        surveyLink={survey}
      />
    </EuiHeaderSectionItem>
  );

  const renderRecentItems = () => (
    <EuiHeaderSectionItem border={useUpdatedHeader ? 'none' : 'right'}>
      <RecentItems
        http={http}
        navLinks$={observables.navLinks$}
        basePath={basePath}
        recentlyAccessed$={observables.recentlyAccessed$}
        workspaceList$={observables.workspaceList$}
        navigateToUrl={application.navigateToUrl}
        renderBreadcrumbs={renderBreadcrumbs(true, true)}
        buttonSize={useApplicationHeader ? 's' : 'xs'}
        loadingCount$={observables.loadingCount$}
        workspaceEnabled={application.capabilities.workspaces.enabled}
      />
    </EuiHeaderSectionItem>
  );
  const renderPrimaryHeaderRight = () => (
    <EuiHeaderSectionItem border="none">
      <HeaderNavControls navControls$={observables.navControlsPrimaryHeaderRight$} />
    </EuiHeaderSectionItem>
  );

  const leftControls = renderLeftControls();
  const centerControls = renderCenterControls();
  const rightControls = renderRightControls();
  const actionMenu = renderActionMenu();
  const badge = renderBadge();

  const renderLegacyHeader = () => (
    <EuiHeader position="fixed" className="primaryHeader" style={sidecarPaddingStyle}>
      <EuiHeaderSection grow={false}>
        <EuiHeaderSectionItem border="right" className="header__toggleNavButtonSection">
          {renderNavToggle()}
        </EuiHeaderSectionItem>

        {leftControls}

        {/* Home loader left */}
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
      </EuiHeaderSection>

      {renderBreadcrumbs()}
      {badge}

      <EuiHeaderSection side="right">
        {actionMenu}
        {centerControls}
        {rightControls}
        {renderHelp()}
      </EuiHeaderSection>
    </EuiHeader>
  );

  const renderPageHeader = () => (
    <div style={sidecarPaddingStyle}>
      <EuiHeader className="primaryHeader newTopNavHeader">
        {renderNavToggle()}

        <EuiHeaderSection grow={false}>{renderRecentItems()}</EuiHeaderSection>

        {renderBreadcrumbs(false, false)}

        {renderPrimaryHeaderRight()}
      </EuiHeader>

      {/* Secondary header */}
      <EuiHeader className="newTopNavHeader">
        <EuiFlexGroup
          justifyContent="spaceBetween"
          gutterSize="none"
          className="secondaryPageHeaderFlexGroup"
        >
          {/* Left Section */}
          <EuiHeaderSection side="left" grow={true} style={{ flexShrink: 1 }}>
            <EuiFlexGroup gutterSize="s" className="leftSecondaryPageHeaderFlexGroup">
              <EuiFlexItem grow={false}>
                <EuiHeaderSectionItem border="none" data-test-subj="headerApplicationTitle">
                  <EuiTitle size="l" className="newTopNavHeaderTitle">
                    {breadcrumbs && (
                      <h1 className="eui-textBreakWord">
                        {breadcrumbs[breadcrumbs.length - 1]?.text}
                      </h1>
                    )}
                  </EuiTitle>
                </EuiHeaderSectionItem>
              </EuiFlexItem>

              {badge && <EuiFlexItem grow={false}>{badge}</EuiFlexItem>}

              {leftControls && <EuiFlexItem grow={false}>{leftControls}</EuiFlexItem>}
            </EuiFlexGroup>
          </EuiHeaderSection>

          {/* Right Section */}
          <EuiHeaderSection side="right">
            <EuiFlexGroup gutterSize="s">
              {centerControls && <EuiFlexItem>{centerControls}</EuiFlexItem>}

              {actionMenu && <EuiFlexItem>{actionMenu}</EuiFlexItem>}

              {rightControls && <EuiFlexItem> {rightControls}</EuiFlexItem>}
            </EuiFlexGroup>
          </EuiHeaderSection>
        </EuiFlexGroup>
      </EuiHeader>

      <EuiHeader className="newTopNavHeader">
        <HeaderControlsContainer
          data-test-subj="headerDescriptionControl"
          controls$={application.currentDescriptionControls$}
          className="headerDescriptionControl"
        />
      </EuiHeader>

      <EuiHeader className="newTopNavHeader">
        <HeaderControlsContainer
          data-test-subj="headerBottomControl"
          controls$={application.currentBottomControls$}
          className="headerBottomControl"
        />
      </EuiHeader>
    </div>
  );

  const renderApplicationHeader = () => (
    <div>
      <EuiHeader className="primaryApplicationHeader newTopNavHeader" style={sidecarPaddingStyle}>
        {renderNavToggle()}
        <EuiHeaderSection side="left" grow={true}>
          {renderRecentItems()}
          {actionMenu}
        </EuiHeaderSection>
        <EuiHeaderSection side="right">
          {rightControls}
          {renderPrimaryHeaderRight()}
        </EuiHeaderSection>
      </EuiHeader>
      <div id="applicationHeaderFilterBar" />
    </div>
  );

  const renderHeader = () => {
    return useApplicationHeader ? renderApplicationHeader() : renderPageHeader();
  };

  // Get the banner plugin configuration
  const bannerPluginConfig = injectedMetadata
    ?.getPlugins()
    ?.find((plugin: { id: string }) => plugin.id === 'banner')?.config;
  const isBannerEnabled = bannerPluginConfig?.enabled === true;

  return (
    <>
      {isBannerEnabled && <div id="pluginGlobalBanner" />}
      <header className={className} data-test-subj="headerGlobalNav">
        <div id="globalHeaderBars">
          {!useUpdatedHeader && useExpandedHeader && renderLegacyExpandedHeader()}
          {useUpdatedHeader ? renderHeader() : renderLegacyHeader()}
        </div>

        {navGroupEnabled ? (
          <CollapsibleNavGroupEnabled
            appId$={application.currentAppId$}
            collapsibleNavHeaderRender={collapsibleNavHeaderRender}
            id={navId}
            navLinks$={observables.navLinks$}
            isNavOpen={isNavOpen}
            basePath={basePath}
            navigateToApp={application.navigateToApp}
            navigateToUrl={application.navigateToUrl}
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
            currentWorkspace$={observables.currentWorkspace$}
            globalSearchCommands={globalSearchCommands}
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
            workspaceEnabled={application.capabilities.workspaces.enabled}
          />
        )}
      </header>
    </>
  );
}
