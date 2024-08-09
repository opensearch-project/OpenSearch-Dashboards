/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Logos } from 'opensearch-dashboards/public';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
} from '@elastic/eui';
import { InternalApplicationStart } from 'src/core/public/application';
import { i18n } from '@osd/i18n';
import { createEuiListItem } from './nav_link';
import { NavGroupItemInMap } from '../../nav_group';
import { ChromeNavLink } from '../../nav_links';
import { ALL_USE_CASE_ID } from '../../../../../core/utils';

export interface CollapsibleNavTopProps {
  navLinks: ChromeNavLink[];
  currentNavGroup?: NavGroupItemInMap;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  logos: Logos;
  onClickBack?: () => void;
  onClickShrink?: () => void;
  shouldShrinkNavigation: boolean;
  visibleUseCases: NavGroupItemInMap[];
}

export const CollapsibleNavTop = ({
  navLinks,
  currentNavGroup,
  navigateToApp,
  logos,
  onClickBack,
  onClickShrink,
  shouldShrinkNavigation,
  visibleUseCases,
}: CollapsibleNavTopProps) => {
  const homeLink = useMemo(() => navLinks.find((link) => link.id === 'home'), [navLinks]);

  const isOutsideWorkspace = useMemo(
    () => !visibleUseCases.find((useCase) => useCase.id === currentNavGroup?.id),
    [currentNavGroup, visibleUseCases]
  );

  const shouldShowBackButton = useMemo(() => {
    if (!currentNavGroup || currentNavGroup.id === ALL_USE_CASE_ID || shouldShrinkNavigation) {
      return false;
    }

    // It means user is in a specific type of workspace
    if (visibleUseCases.length <= 1) {
      return false;
    }

    if (isOutsideWorkspace) {
      return true;
    }

    return visibleUseCases.length > 1;
  }, [visibleUseCases, currentNavGroup, shouldShrinkNavigation, isOutsideWorkspace]);

  const shouldShowHomeLink = useMemo(() => {
    if (!homeLink || shouldShrinkNavigation) return false;

    return !shouldShowBackButton;
  }, [shouldShowBackButton, homeLink, shouldShrinkNavigation]);

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
    <div className="side-naivgation-top">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
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
              onClick={isOutsideWorkspace ? homeLinkProps.onClick : onClickBack}
              data-test-subj="collapsibleNavBackButton"
            >
              <EuiIcon type="arrowLeft" />
              {isOutsideWorkspace
                ? i18n.translate('core.ui.primaryNav.homeButtonLabel', {
                    defaultMessage: 'Home',
                  })
                : i18n.translate('core.ui.primaryNav.backButtonLabel', {
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
      <EuiSpacer />
    </div>
  );
};
