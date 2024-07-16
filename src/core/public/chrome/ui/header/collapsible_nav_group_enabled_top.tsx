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

export interface CollapsibleNavTopProps {
  navLinks: ChromeNavLink[];
  navGroupsMap: Record<string, NavGroupItemInMap>;
  currentNavGroup?: NavGroupItemInMap;
  navigateToApp: InternalApplicationStart['navigateToApp'];
  logos: Logos;
  onClickBack?: () => void;
  onClickShrink?: () => void;
  shouldShrinkNavigation: boolean;
}

export const CollapsibleNavTop = ({
  navLinks,
  navGroupsMap,
  currentNavGroup,
  navigateToApp,
  logos,
  onClickBack,
  onClickShrink,
  shouldShrinkNavigation,
}: CollapsibleNavTopProps) => {
  const homeLink = useMemo(() => navLinks.find((link) => link.id === 'home'), [navLinks]);

  const shouldShowBackButton = useMemo(
    () =>
      !shouldShrinkNavigation &&
      Object.values(navGroupsMap).filter((item) => !item.type).length > 1 &&
      currentNavGroup,
    [navGroupsMap, currentNavGroup, shouldShrinkNavigation]
  );

  const shouldShowHomeLink = useMemo(() => {
    if (!homeLink || shouldShrinkNavigation) return false;

    return !shouldShowBackButton;
  }, [shouldShowBackButton, homeLink, shouldShrinkNavigation]);

  const homeLinkProps = useMemo(() => {
    if (shouldShowHomeLink) {
      const propsForHomeIcon = createEuiListItem({
        link: homeLink as ChromeNavLink,
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
  }, [shouldShowHomeLink, homeLink, navigateToApp]);

  return (
    <div className="side-naivgation-top">
      <EuiSpacer size="s" />
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
              onClick={onClickBack}
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
      <EuiSpacer />
    </div>
  );
};
