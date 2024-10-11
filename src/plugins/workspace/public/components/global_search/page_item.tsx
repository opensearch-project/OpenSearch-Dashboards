/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHighlight, EuiSimplifiedBreadcrumbs } from '@elastic/eui';
import {
  ApplicationStart,
  ChromeNavLink,
  ChromeRegistrationNavLink,
  NavGroupItemInMap,
  WorkspaceObject,
} from 'opensearch-dashboards/public';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { WorkspaceTitleDisplay } from '../workspace_name/workspace_name';
import { WorkspaceUseCase } from '../../types';
import { NavGroupType } from '../../../../../core/public';

interface Props {
  currentWorkspace: WorkspaceObject | null;
  link: ChromeRegistrationNavLink & ChromeNavLink & { navGroup: NavGroupItemInMap };
  application: ApplicationStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  search: string;
  callback?: () => void;
}

export const GlobalSearchPageItem = ({
  link,
  currentWorkspace,
  application,
  registeredUseCases$,
  search,
  callback,
}: Props) => {
  const availableUseCases = useObservable(registeredUseCases$);
  const breadcrumbs = [];
  if (currentWorkspace && link.navGroup.type !== NavGroupType.SYSTEM) {
    breadcrumbs.push({
      text: (
        <WorkspaceTitleDisplay
          workspace={currentWorkspace}
          availableUseCases={availableUseCases || []}
        />
      ),
    });
  } else {
    breadcrumbs.push({ text: link.navGroup.title });
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
    breadcrumbs.push({ text: parentNavLinkTitle });
  }

  const onNavItemClick = (id: string) => {
    callback?.();
    application.navigateToApp(id);
  };

  breadcrumbs.push({
    text,
    onClick: () => {
      onNavItemClick(link.id);
    },
  });

  return (
    <div
      key={link.id}
      aria-hidden="true"
      data-test-subj={`global-search-item-${link.id}`}
      onClick={() => {
        onNavItemClick(link.id);
      }}
    >
      <EuiSimplifiedBreadcrumbs breadcrumbs={breadcrumbs} hideTrailingSeparator responsive />
    </div>
  );
};
