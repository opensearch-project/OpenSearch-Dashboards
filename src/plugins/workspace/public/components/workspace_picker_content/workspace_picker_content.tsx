/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import React, { useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import moment from 'moment';
import {
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiFieldSearch,
  EuiListGroup,
  EuiListGroupItem,
  EuiEmptyPrompt,
  EuiFlexItem,
  EuiFlexGroup,
} from '@elastic/eui';

import { BehaviorSubject } from 'rxjs';
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { WorkspaceUseCase } from '../../types';
import { validateWorkspaceColor } from '../../../common/utils';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../../utils';

function sortBy<T>(getkey: (item: T) => number | undefined) {
  return (a: T, b: T): number => {
    const aValue = getkey(a);
    const bValue = getkey(b);

    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    return bValue - aValue;
  };
}

const searchFieldPlaceholder = i18n.translate('workspace.menu.search.placeholder', {
  defaultMessage: 'Search workspace name',
});

const getValidWorkspaceColor = (color?: string) =>
  validateWorkspaceColor(color) ? color : undefined;

interface UpdatedWorkspaceObject extends WorkspaceObject {
  accessTimeStamp?: number;
  accessTime?: string;
}
interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  onClickWorkspace?: () => void;
  isReturnLists?: boolean;
}

export const WorkspacePickerContent = ({
  coreStart,
  registeredUseCases$,
  onClickWorkspace,
}: Props) => {
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;
  const availableUseCases = useObservable(registeredUseCases$, []);
  const [search, setSearch] = useState('');
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);

  const updatedRecentWorkspaceList: UpdatedWorkspaceObject[] = useMemo(() => {
    const recentWorkspaces = recentWorkspaceManager.getRecentWorkspaces();
    const updatedList = workspaceList.map((workspace) => {
      const recentWorkspace = recentWorkspaces.find((recent) => recent.id === workspace.id);

      if (recentWorkspace) {
        return {
          ...workspace,
          accessTimeStamp: recentWorkspace.timestamp,
          accessTime: `viewed ${moment(recentWorkspace.timestamp).fromNow()}`,
        };
      }
      return workspace as UpdatedWorkspaceObject;
    });

    return updatedList.sort(sortBy((workspace) => workspace.accessTimeStamp));
  }, [workspaceList]);

  const queryFromList = ({ list, query }: { list: UpdatedWorkspaceObject[]; query: string }) => {
    if (!list || list.length === 0) {
      return [];
    }
    if (query && query.trim() !== '') {
      const normalizedQuery = query.toLowerCase();
      const result = list.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
      return result;
    }
    return list;
  };

  const queriedWorkspace = useMemo(() => {
    return queryFromList({ list: updatedRecentWorkspaceList, query: search });
  }, [updatedRecentWorkspaceList, search]);

  const getUseCase = (workspace: WorkspaceObject) => {
    if (!workspace.features) {
      return;
    }
    const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features);
    return availableUseCases.find((useCase) => useCase.id === useCaseId);
  };

  const getEmptyStatePrompt = () => {
    return (
      <EuiEmptyPrompt
        className="eui-fullHeight"
        iconType="wsSelector"
        data-test-subj="empty-workspace-prompt"
        title={
          <EuiText size="m">
            <p>
              {i18n.translate('workspace.picker.empty.state.title', {
                defaultMessage: 'No workspace available',
              })}
            </p>
          </EuiText>
        }
        body={
          <EuiText size="s">
            <p>
              {isDashboardAdmin
                ? i18n.translate('workspace.picker.empty.state.description.admin', {
                    defaultMessage: 'Create a workspace to get start',
                  })
                : i18n.translate('workspace.picker.empty.state.description.noAdmin', {
                    defaultMessage:
                      'Contact your administrator to create a workspace or to be added to an existing one',
                  })}
            </p>
          </EuiText>
        }
      />
    );
  };

  const getWorkspaceLists = (filterWorkspaceList: UpdatedWorkspaceObject[]) => {
    const listItems = filterWorkspaceList.map((workspace: UpdatedWorkspaceObject) => {
      const useCase = getUseCase(workspace);
      const useCaseURL = getUseCaseUrl(useCase, workspace, coreStart.application, coreStart.http);

      return (
        <>
          <EuiHorizontalRule size="full" margin="none" />
          <EuiListGroupItem
            // using inline style to make sure that the list item will be expanded，className="eui-fullWidth" is not working, need to set minWidth
            style={{ width: '100%', minWidth: '0' }}
            key={workspace.id}
            size="s"
            data-test-subj={`workspace-menu-item-${workspace.id}`}
            icon={
              <EuiIcon
                size="l"
                type={useCase?.icon || 'wsSelector'}
                color={getValidWorkspaceColor(workspace.color)}
              />
            }
            label={
              <EuiFlexGroup direction="column" gutterSize="none" className="eui-fullWidth">
                <EuiFlexItem>
                  <EuiText className="eui-textTruncate">{workspace.name}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFlexGroup justifyContent="spaceBetween">
                    <EuiFlexItem className="eui-textLeft" grow={false}>
                      <EuiText size="xs" color="subdued">
                        {useCase?.title}
                      </EuiText>
                    </EuiFlexItem>
                    {/* text-alignRight is ineffective here*/}
                    <EuiFlexItem grow={1} style={{ position: 'absolute', right: '0px' }}>
                      <EuiText size="xs" color="subdued">
                        {workspace.accessTime}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            }
            onClick={() => {
              onClickWorkspace?.();
              window.location.assign(useCaseURL);
            }}
          />
        </>
      );
    });
    return listItems;
  };

  const getWorkspaceListGroup = (filterWorkspaceList: UpdatedWorkspaceObject[]) => {
    const listItems = getWorkspaceLists(filterWorkspaceList);
    return (
      <>
        <EuiListGroup gutterSize="none" maxWidth="300px">
          {listItems}
        </EuiListGroup>
      </>
    );
  };

  return (
    <>
      <EuiFieldSearch
        compressed={true}
        fullWidth={true}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchFieldPlaceholder}
      />
      <EuiSpacer size="s" />
      <EuiHorizontalRule size="full" margin="none" />

      <EuiPanel
        paddingSize="none"
        hasBorder={false}
        hasShadow={false}
        color="transparent"
        // adding this inline style to make sure that part of list won't be hidden
        style={{ maxHeight: 'calc(100% - 50px)' }}
        className="euiYScrollWithShadows"
      >
        {queriedWorkspace.length > 0 && getWorkspaceListGroup(queriedWorkspace)}

        {queriedWorkspace.length === 0 && getEmptyStatePrompt()}
      </EuiPanel>
    </>
  );
};
