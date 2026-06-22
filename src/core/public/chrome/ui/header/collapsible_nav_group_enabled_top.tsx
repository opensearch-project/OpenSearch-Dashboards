/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { i18n } from '@osd/i18n';
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
          {/* Row 1: Logo (home link) + action buttons. Expanded shows search, a
              collapse button, and a pin to keep the nav open. The logo is just
              the home link. */}
          <div className="iconSideNavTop__row">
            <EuiButtonEmpty
              flush="both"
              {...homeLinkProps}
              onClick={onIconClick}
              className="navGroupEnabledHomeIcon iconSideNavTop__logo"
            >
              <EuiIcon type={homeIcon} size="l" data-test-subj={`collapsibleNavIcon-${homeIcon}`} />
            </EuiButtonEmpty>
            {/* Action buttons: visible in expanded, hidden (overflow clipped) in
                collapsed. Search is a destination affordance and sits in its own
                slot; collapse + pin are chrome controls, grouped together at the
                trailing edge so the two kinds don't read as one cluster. */}
            <div className="iconSideNavTop__actions">
              <div className="iconSideNavTop__searchSlot">{searchElement}</div>
              <div className="iconSideNavTop__chromeControls">
                <EuiButtonIcon
                  onClick={onClickShrink}
                  iconType="dockedLeft"
                  color="text"
                  display="empty"
                  aria-label={i18n.translate('core.ui.primaryNav.collapseNavigation', {
                    defaultMessage: 'Collapse navigation',
                  })}
                  data-test-subj="collapsibleNavCollapseButton"
                  size="xs"
                />
                {onIsLockedUpdate && (
                  <EuiButtonIcon
                    onClick={() => onIsLockedUpdate(!isLocked)}
                    iconType={isLocked ? 'lock' : 'lockOpen'}
                    color="text"
                    display="empty"
                    aria-label={
                      isLocked
                        ? i18n.translate('core.ui.primaryNav.unpinNavigation', {
                            defaultMessage: 'Unpin navigation',
                          })
                        : i18n.translate('core.ui.primaryNav.pinNavigation', {
                            defaultMessage: 'Pin navigation open',
                          })
                    }
                    data-test-subj="collapsibleNavLockButton"
                    size="xs"
                  />
                )}
              </div>
            </div>
          </div>
          {/* Row 2 (collapsed only): hamburger expand button + search, stacked
              below the logo. This is the explicit control to open the full nav. */}
          <div className="iconSideNavTop__collapsedControls">
            <EuiButtonIcon
              onClick={onClickExpand}
              iconType="dockedLeft"
              color="text"
              display="empty"
              aria-label={i18n.translate('core.ui.primaryNav.expandNavigation', {
                defaultMessage: 'Expand navigation',
              })}
              data-test-subj="collapsibleNavExpandButton"
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
