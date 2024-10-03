/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHighlight, EuiSimplifiedBreadcrumbs } from '@elastic/eui';
import {
  ApplicationStart,
  ChromeNavGroup,
  ChromeNavLink,
  ChromeRegistrationNavLink,
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
  link: ChromeRegistrationNavLink & ChromeNavLink & { navGroup: ChromeNavGroup };
  application: ApplicationStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  search: string;
}

export const GlobalSearchPageItem = ({
  link,
  currentWorkspace,
  application,
  registeredUseCases$,
  search,
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

  breadcrumbs.push({
    text,
    onClick: () => {
      application.navigateToUrl(link.baseUrl);
    },
  });

  return <EuiSimplifiedBreadcrumbs breadcrumbs={breadcrumbs} hideTrailingSeparator responsive />;
};
