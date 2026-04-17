/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { Logos } from 'opensearch-dashboards/public';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import { InternalApplicationStart } from 'src/core/public/application';
import { createEuiListItem } from './nav_link';
import { NavGroupItemInMap } from '../../nav_group';
import { ChromeNavLink } from '../../nav_links';
export interface CollapsibleNavTopProps {
  collapsibleNavHeaderRender?: () => JSX.Element | null;
  homeLink?: ChromeNavLink;
  currentNavGroup?: NavGroupItemInMap;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  logos: Logos;
  onClickShrink?: () => void;
  onClickExpand?: () => void;
  shouldShrinkNavigation: boolean;
  isLocked?: boolean;
  onIsLockedUpdate?: (isLocked: boolean) => void;
  enableIconSideNav?: boolean;
  /** Search icon element to render in the top bar (icon side nav only). */
  searchElement?: React.ReactNode;
}

export const CollapsibleNavTop = ({
  collapsibleNavHeaderRender,
  currentNavGroup,
  navigateToApp,
  logos,
  onClickShrink,
  onClickExpand,
  shouldShrinkNavigation,
  homeLink,
  isLocked,
  onIsLockedUpdate,
  enableIconSideNav,
  searchElement,
}: CollapsibleNavTopProps) => {
  const homeIcon = logos.Mark.url;

  const homeLinkProps = useMemo(() => {
    if (homeLink) {
      const propsForHomeIcon = createEuiListItem({
        link: homeLink,
        appId: 'home',
        dataTestSubj: 'collapsibleNavHome',
        navigateToApp,
      });
      return {
        'data-test-subj': propsForHomeIcon['data-test-subj'],
        onClick: propsForHomeIcon.onClick,
      };
    }

    return {};
  }, [homeLink, navigateToApp]);

  const onIconClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      homeLinkProps.onClick?.(e);
    },
    [homeLinkProps]
  );

  return (
    <EuiPanel
      color="transparent"
      hasBorder={false}
      hasShadow={false}
      className="navGroupEnabledNavTopWrapper"
    >
      {/* The spacer here is used for align with the page header */}
      <EuiSpacer size="xs" />
      {enableIconSideNav ? (
        // Icon side nav — single stable DOM tree. CSS handles collapsed vs expanded layout.
        <div
          className={`iconSideNavTop ${
            shouldShrinkNavigation ? 'iconSideNavTop--collapsed' : 'iconSideNavTop--expanded'
          }`}
        >
          {/* Row 1: Logo + action buttons */}
          <div className="iconSideNavTop__row">
            <EuiButtonEmpty
              flush="both"
              {...homeLinkProps}
              onClick={onIconClick}
              className="navGroupEnabledHomeIcon iconSideNavTop__logo"
            >
              <EuiIcon type={homeIcon} size="l" data-test-subj={`collapsibleNavIcon-${homeIcon}`} />
            </EuiButtonEmpty>
            {/* Action buttons: visible in expanded, hidden (overflow clipped) in collapsed */}
            <div className="iconSideNavTop__actions">
              {searchElement}
              {onIsLockedUpdate && (
                <EuiButtonIcon
                  onClick={() => onIsLockedUpdate(!isLocked)}
                  iconType={isLocked ? 'lock' : 'lockOpen'}
                  color="subdued"
                  display="empty"
                  aria-label={isLocked ? 'Unlock navigation' : 'Lock navigation'}
                  data-test-subj="collapsibleNavLockButton"
                  size="xs"
                />
              )}
              <EuiButtonIcon
                onClick={onClickShrink}
                iconType="menuLeft"
                color="subdued"
                display="empty"
                aria-label="Collapse navigation"
                data-test-subj="collapsibleNavToggleButton"
                size="xs"
              />
            </div>
          </div>
          {/* Row 2 (collapsed only): hamburger + search stacked below logo */}
          <div className="iconSideNavTop__collapsedControls">
            <EuiButtonIcon
              onClick={onClickExpand}
              iconType="menu"
              color="subdued"
              display="empty"
              aria-label="Expand navigation"
              data-test-subj="collapsibleNavToggleButton"
              size="s"
            />
            {searchElement}
          </div>
        </div>
      ) : (
        // Original nav: home icon when expanded, hamburger when collapsed
        <EuiFlexGroup responsive={false} justifyContent="spaceBetween">
          {!shouldShrinkNavigation ? (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                flush="both"
                {...homeLinkProps}
                onClick={onIconClick}
                className="navGroupEnabledHomeIcon"
              >
                <EuiIcon
                  type={homeIcon}
                  size="xl"
                  data-test-subj={`collapsibleNavIcon-${homeIcon}`}
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
          ) : null}
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              onClick={onClickShrink}
              iconType={shouldShrinkNavigation ? 'menu' : 'menuLeft'}
              color="subdued"
              display="empty"
              aria-label="shrink-button"
              data-test-subj="collapsibleNavShrinkButton"
              size="xs"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      {
        // Nav groups with type are system(global) nav group and we should show title for those nav groups.
        // Hide when icon side nav is collapsed — no room in 48px.
        // Show in expanded mode (including icon side nav) for vertical alignment with collapsed state.
        !(enableIconSideNav && shouldShrinkNavigation) &&
          (currentNavGroup?.type || collapsibleNavHeaderRender) && (
            <>
              <EuiSpacer />
              {currentNavGroup?.type ? (
                <EuiText size="s">
                  <h3>{currentNavGroup.title}</h3>
                </EuiText>
              ) : (
                collapsibleNavHeaderRender?.()
              )}
            </>
          )
      }
    </EuiPanel>
  );
};
