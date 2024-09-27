/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Logos, WorkspacesStart } from 'opensearch-dashboards/public';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import { InternalApplicationStart } from 'src/core/public/application';
import { createEuiListItem } from './nav_link';
import { ChromeNavGroupServiceStartContract, NavGroupItemInMap } from '../../nav_group';
import { ChromeNavLink } from '../../nav_links';
import { ALL_USE_CASE_ID } from '../../../../../core/utils';
import { fulfillRegistrationLinksToChromeNavLinks } from '../../utils';
import './collapsible_nav_group_enabled_top.scss';

export interface CollapsibleNavTopProps {
  collapsibleNavHeaderRender?: () => JSX.Element | null;
  homeLink?: ChromeNavLink;
  navGroupsMap: Record<string, NavGroupItemInMap>;
  currentNavGroup?: NavGroupItemInMap;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  logos: Logos;
  onClickShrink?: () => void;
  shouldShrinkNavigation: boolean;
  visibleUseCases: NavGroupItemInMap[];
  currentWorkspace$: WorkspacesStart['currentWorkspace$'];
  setCurrentNavGroup: ChromeNavGroupServiceStartContract['setCurrentNavGroup'];
  navLinks: ChromeNavLink[];
}

export const CollapsibleNavTop = ({
  collapsibleNavHeaderRender,
  currentNavGroup,
  navigateToApp,
  logos,
  onClickShrink,
  shouldShrinkNavigation,
  visibleUseCases,
  currentWorkspace$,
  setCurrentNavGroup,
  homeLink,
  navGroupsMap,
  navLinks,
}: CollapsibleNavTopProps) => {
  const currentWorkspace = useObservable(currentWorkspace$);

  const firstVisibleNavLinkInFirstVisibleUseCase = useMemo(
    () =>
      fulfillRegistrationLinksToChromeNavLinks(
        navGroupsMap[visibleUseCases[0]?.id]?.navLinks || [],
        navLinks
      )[0],
    [navGroupsMap, navLinks, visibleUseCases]
  );

  /**
   * We can ensure that left nav is inside second level once all the following conditions are met:
   * 1. Inside a workspace
   * 2. The use case type of current workspace is all use case
   * 3. current nav group is not all use case
   */
  const isInsideSecondLevelOfAllWorkspace =
    !!currentWorkspace &&
    visibleUseCases[0]?.id === ALL_USE_CASE_ID &&
    currentNavGroup?.id !== ALL_USE_CASE_ID;

  const homeIcon = logos.Mark.url;
  const icon =
    !!currentWorkspace && visibleUseCases.length === 1
      ? visibleUseCases[0].icon || homeIcon
      : homeIcon;

  const shouldShowBackButton = !shouldShrinkNavigation && isInsideSecondLevelOfAllWorkspace;
  const shouldShowHomeLink = !shouldShrinkNavigation && !shouldShowBackButton;

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
      if (shouldShowBackButton || visibleUseCases.length === 1) {
        if (firstVisibleNavLinkInFirstVisibleUseCase) {
          navigateToApp(firstVisibleNavLinkInFirstVisibleUseCase.id);
        }

        setCurrentNavGroup(visibleUseCases[0].id);
      } else if (shouldShowHomeLink) {
        homeLinkProps.onClick?.(e);
      }
    },
    [
      homeLinkProps,
      shouldShowBackButton,
      firstVisibleNavLinkInFirstVisibleUseCase,
      navigateToApp,
      setCurrentNavGroup,
      visibleUseCases,
      shouldShowHomeLink,
    ]
  );

  return (
    <EuiPanel hasBorder={false} hasShadow={false} className="navGroupEnabledNavTopWrapper">
      <EuiFlexGroup responsive={false} alignItems="center" justifyContent="spaceBetween">
        {!shouldShrinkNavigation ? (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty flush="both" {...homeLinkProps} onClick={onIconClick}>
              <EuiIcon
                type={icon}
                size="l"
                className="leftNavTopIcon"
                data-test-subj={`collapsibleNavIcon-${icon}`}
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
        ) : null}
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            onClick={onClickShrink}
            iconType={shouldShrinkNavigation ? 'menu' : 'menuLeft'}
            color="subdued"
            display={shouldShrinkNavigation ? 'empty' : 'base'}
            aria-label="shrink-button"
            data-test-subj="collapsibleNavShrinkButton"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {currentNavGroup?.title && collapsibleNavHeaderRender && (
        <>
          <EuiSpacer />
          {collapsibleNavHeaderRender()}
        </>
      )}
    </EuiPanel>
  );
};
