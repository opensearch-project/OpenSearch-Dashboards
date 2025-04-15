/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBreadcrumb, EuiHighlight, EuiSimplifiedBreadcrumbs } from '@elastic/eui';
import {
  ChromeNavLink,
  ChromeRegistrationNavLink,
  NavGroupItemInMap,
} from 'opensearch-dashboards/public';
import React from 'react';

interface Props {
  link: ChromeRegistrationNavLink & ChromeNavLink & { navGroup: NavGroupItemInMap };
  search: string;
  callback?: () => void;
  renderBreadcrumbs?: (breadcrumbs: EuiBreadcrumb[]) => EuiBreadcrumb[];
}

export const GlobalSearchPageItem = ({ link, search, callback, renderBreadcrumbs }: Props) => {
  let breadcrumbs: EuiBreadcrumb[] = [];

  const appId = link.id.toLowerCase();
  const isLanding = appId.endsWith('landing');
  const text = (
    <EuiHighlight search={search} highlightAll={true}>
      {isLanding ? `${link.navGroup.title} ${link.title}` : link.title}
    </EuiHighlight>
  );

  const isOverviewPage = appId.endsWith('overview');
  if (isOverviewPage && link.category) {
    breadcrumbs.push({ text: link.category.label });
  }

  if (link.parentNavLinkId) {
    const parentNavLinkTitle = link.navGroup.navLinks.find(
      (navLink) => navLink.id === link.parentNavLinkId
    )?.title;
    if (parentNavLinkTitle) {
      breadcrumbs.push({
        text: (
          <EuiHighlight search={search} highlightAll={true}>
            {parentNavLinkTitle}
          </EuiHighlight>
        ),
      });
    }
  }

  const onNavItemClick = () => {
    callback?.();
  };

  if (renderBreadcrumbs) {
    breadcrumbs = renderBreadcrumbs(breadcrumbs);
  }

  breadcrumbs.push({
    text,
    onClick: () => {},
  });

  return (
    <div
      key={link.id}
      aria-hidden="true"
      data-test-subj={`global-search-item-${link.id}`}
      onClick={() => {
        onNavItemClick();
      }}
    >
      <EuiSimplifiedBreadcrumbs breadcrumbs={breadcrumbs} hideTrailingSeparator responsive />
    </div>
  );
};
