/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHighlight,
  EuiIcon,
  EuiSimplifiedBreadcrumbs,
} from '@elastic/eui';
import {
  ApplicationStart,
  ChromeNavLink,
  ChromeRegistrationNavLink,
  HttpStart,
  NavGroupItemInMap,
  WorkspaceObject,
} from 'opensearch-dashboards/public';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { useObservable } from 'react-use';
import { WorkspaceTitleDisplay } from '../workspace_name/workspace_name';
import { WorkspaceUseCase } from '../../types';
import { NavGroupType } from '../../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';

interface Props {
  currentWorkspace: WorkspaceObject | null;
  link: ChromeRegistrationNavLink & ChromeNavLink & { navGroup: NavGroupItemInMap };
  application: ApplicationStart;
  http: HttpStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  search: string;
  callback?: () => void;
}

export const GlobalSearchPageItem = ({
  link,
  currentWorkspace,
  application,
  http,
  registeredUseCases$,
  search,
  callback,
}: Props) => {
  const availableUseCases = useObservable(registeredUseCases$);
  const breadcrumbs = [];
  const isPageOutOfWorkspace = link.navGroup.type === NavGroupType.SYSTEM;

  const navGroupElement = (navGroup: NavGroupItemInMap) => (
    <EuiFlexGroup gutterSize="s" alignItems="center">
      {navGroup.icon && (
        <EuiFlexItem>
          <EuiIcon type={navGroup.icon} color="text" />
        </EuiFlexItem>
      )}
      <EuiFlexItem>{navGroup.title}</EuiFlexItem>
    </EuiFlexGroup>
  );

  if (currentWorkspace && !isPageOutOfWorkspace) {
    breadcrumbs.push({
      text: (
        <WorkspaceTitleDisplay
          workspace={currentWorkspace}
          availableUseCases={availableUseCases || []}
        />
      ),
    });
  } else {
    breadcrumbs.push({ text: navGroupElement(link.navGroup) });
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
    if (isPageOutOfWorkspace && currentWorkspace) {
      // remove workspace information in the URL, special handling for data source which could visible both in/out workspace
      const urlWithoutWorkspace = formatUrlWithWorkspaceId(link.href, '', http.basePath);
      window.location.assign(urlWithoutWorkspace);
      return;
    }
    application.navigateToApp(link.id);
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
