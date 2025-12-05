/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChromeNavLink,
  ChromeRegistrationNavLink,
  NavGroupItemInMap,
  WorkspaceObject,
} from 'opensearch-dashboards/public';
import React from 'react';
import { useObservable } from 'react-use';
import { EuiBreadcrumb } from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';

import { NavGroupType } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceTitleDisplay } from '../workspace_name/workspace_name';
import { renderNavGroupElement, GlobalSearchPageItem } from '../../../../../core/public';

export type NavLink = { navGroup: NavGroupItemInMap } & ChromeRegistrationNavLink & ChromeNavLink;

export const WorkspaceGlobalSearchPageItem = ({
  link,
  search,
  currentWorkspace,
  registeredUseCases$,
  onCallback,
}: {
  link: NavLink;
  search: string;
  currentWorkspace: WorkspaceObject | null;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  onCallback: (link: NavLink) => void;
}) => {
  const availableUseCases = useObservable(registeredUseCases$);

  const renderBreadcrumbs = (props: { breadcrumbs: EuiBreadcrumb[] }) => {
    const { breadcrumbs } = props;
    const isPageOutOfWorkspace = link.navGroup.type === NavGroupType.SYSTEM;

    if (currentWorkspace && !isPageOutOfWorkspace) {
      return [
        {
          text: (
            <WorkspaceTitleDisplay
              workspace={currentWorkspace}
              availableUseCases={availableUseCases || []}
            />
          ),
        },
        ...breadcrumbs,
      ];
    } else {
      return [{ text: renderNavGroupElement(link.navGroup) }, ...breadcrumbs];
    }
  };

  return (
    <GlobalSearchPageItem
      link={link}
      search={search}
      callback={() => onCallback(link)}
      renderBreadcrumbs={(breadcrumbs) => renderBreadcrumbs({ breadcrumbs })}
    />
  );
};
