/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBreadcrumb, EuiHighlight, EuiSimplifiedBreadcrumbs } from '@elastic/eui';
import {
  ApplicationStart,
  ChromeNavLink,
  ChromeRegistrationNavLink,
  NavGroupItemInMap,
} from 'opensearch-dashboards/public';
import React from 'react';

interface Props {
  link: ChromeRegistrationNavLink & ChromeNavLink & { navGroup: NavGroupItemInMap };
  application: ApplicationStart;
  search: string;
  callback?: () => void;
  customizeBreadcrumbs?: (breadcrumbs: EuiBreadcrumb[]) => void;
}

export const GlobalSearchPageItem = ({
  link,
  application,
  search,
  callback,
  customizeBreadcrumbs,
}: Props) => {
  // const availableUseCases = useObservable(registeredUseCases$);
  const breadcrumbs: EuiBreadcrumb[] = [];
  if (customizeBreadcrumbs) {
    customizeBreadcrumbs(breadcrumbs);
  }

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
