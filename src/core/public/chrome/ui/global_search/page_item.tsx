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
import React, { useMemo } from 'react';

interface Props {
  link: ChromeRegistrationNavLink & ChromeNavLink & { navGroup: NavGroupItemInMap };
  search: string;
  callback?: () => void;
  renderBreadcrumbs?: (breadcrumbs: EuiBreadcrumb[]) => EuiBreadcrumb[];
}

export const GlobalSearchPageItem = ({ link, search, callback, renderBreadcrumbs }: Props) => {
  const breadcrumbs = useMemo(() => {
    const breadcrumbList: EuiBreadcrumb[] = [];
    const appId = link.id.toLowerCase();
    const isLanding = appId.endsWith('landing');
    const text = (
      <EuiHighlight search={search} highlightAll={true}>
        {isLanding ? `${link.navGroup.title} ${link.title}` : link.title}
      </EuiHighlight>
    );

    /* Wazuh BEGIN */
    if (
      link.category &&
      !link.parentNavLinkId &&
      link.category.label.trim().toLowerCase() !== (link.title || '').trim().toLowerCase()
    ) {
      breadcrumbList.push({
        text: (
          <EuiHighlight search={search} highlightAll={true}>
            {link.category.label}
          </EuiHighlight>
        ),
      });
    }
    /* Wazuh END */

    if (link.parentNavLinkId) {
      const parentNavLinkTitle = link.navGroup.navLinks.find(
        (navLink) => navLink.id === link.parentNavLinkId
      )?.title;
      if (parentNavLinkTitle) {
        breadcrumbList.push({
          text: (
            <EuiHighlight search={search} highlightAll={true}>
              {parentNavLinkTitle}
            </EuiHighlight>
          ),
        });
      }
    }

    const processedCrumbs = renderBreadcrumbs ? renderBreadcrumbs(breadcrumbList) : breadcrumbList;

    return [
      ...processedCrumbs,
      {
        text,
        onClick: () => {},
      },
    ];
  }, [link, search, renderBreadcrumbs]);

  const onNavItemClick = () => {
    callback?.();
  };

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
