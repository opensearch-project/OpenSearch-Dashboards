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
  shouldShrinkNavigation: boolean;
}

export const CollapsibleNavTop = ({
  collapsibleNavHeaderRender,
  currentNavGroup,
  navigateToApp,
  logos,
  onClickShrink,
  shouldShrinkNavigation,
  homeLink,
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
      {
        // Nav groups with type are system(global) nav group and we should show title for those nav groups
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
