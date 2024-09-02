/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Logos, WorkspacesStart } from 'opensearch-dashboards/public';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { InternalApplicationStart } from 'src/core/public/application';
import { i18n } from '@osd/i18n';
import { createEuiListItem } from './nav_link';
import { ChromeNavGroupServiceStartContract, NavGroupItemInMap } from '../../nav_group';
import { ChromeNavLink } from '../../nav_links';
import { ALL_USE_CASE_ID } from '../../../../../core/utils';

export interface CollapsibleNavTopProps {
  homeLink?: ChromeNavLink;
  firstVisibleNavLinkOfAllUseCase?: ChromeNavLink;
  currentNavGroup?: NavGroupItemInMap;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  logos: Logos;
  onClickShrink?: () => void;
  shouldShrinkNavigation: boolean;
  visibleUseCases: NavGroupItemInMap[];
  currentWorkspace$: WorkspacesStart['currentWorkspace$'];
  setCurrentNavGroup: ChromeNavGroupServiceStartContract['setCurrentNavGroup'];
}

export const CollapsibleNavTop = ({
  currentNavGroup,
  navigateToApp,
  logos,
  onClickShrink,
  shouldShrinkNavigation,
  visibleUseCases,
  currentWorkspace$,
  setCurrentNavGroup,
  homeLink,
  firstVisibleNavLinkOfAllUseCase,
}: CollapsibleNavTopProps) => {
  const currentWorkspace = useObservable(currentWorkspace$);

  /**
   * We can ensure that left nav is inside second level once all the following conditions are met:
   * 1. Inside a workspace
   * 2. The use case type of current workspace is all use case
   * 3. current nav group is not all use case
   */
  const isInsideSecondLevelOfAllWorkspace =
    !!currentWorkspace &&
    visibleUseCases[0].id === ALL_USE_CASE_ID &&
    currentNavGroup?.id !== ALL_USE_CASE_ID;

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
        href: propsForHomeIcon.href,
      };
    }

    return {};
  }, [homeLink, navigateToApp]);

  return (
    <div>
      <EuiFlexGroup responsive={false} alignItems="center" justifyContent="spaceBetween">
        {shouldShowHomeLink ? (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="l" {...homeLinkProps}>
              <EuiIcon type={logos.Mark.url} size="l" />
            </EuiButtonEmpty>
          </EuiFlexItem>
        ) : null}
        {shouldShowBackButton ? (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="l"
              onClick={() => {
                if (firstVisibleNavLinkOfAllUseCase) {
                  navigateToApp(firstVisibleNavLinkOfAllUseCase.id);
                }
                setCurrentNavGroup(ALL_USE_CASE_ID);
              }}
              data-test-subj="collapsibleNavBackButton"
            >
              <EuiIcon type="arrowLeft" />
              {i18n.translate('core.ui.primaryNav.backButtonLabel', {
                defaultMessage: 'Back',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        ) : null}
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            onClick={onClickShrink}
            iconType={shouldShrinkNavigation ? 'menu' : 'menuLeft'}
            color="text"
            display={shouldShrinkNavigation ? 'empty' : 'base'}
            aria-label="shrink-button"
            data-test-subj="collapsibleNavShrinkButton"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {currentNavGroup?.title && (
        <>
          <EuiSpacer />
          <EuiText>
            <div className="nav-link-item" style={{ fontWeight: 'normal' }}>
              {currentNavGroup?.title}
            </div>
          </EuiText>
        </>
      )}
    </div>
  );
};
