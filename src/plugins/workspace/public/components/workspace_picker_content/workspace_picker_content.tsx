/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { Fragment, useMemo, useState } from 'react';
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

const searchFieldPlaceholder = i18n.translate('workspace.menu.search.placeholder', {
  defaultMessage: 'Search workspace name',
});

const getValidWorkspaceColor = (color?: string) =>
  validateWorkspaceColor(color) ? color : undefined;

interface UpdatedWorkspaceObject extends WorkspaceObject {
  accessTimeStamp?: number;
}

/**
 * The "Viewed 2 hours ago" / "Not visited recently" label for a row.
 *
 * Derived at render time rather than precomputed for the whole list:
 * `moment().fromNow()` is comparatively expensive and only the handful of
 * recently-visited workspaces (the recent log is capped at 10) produce a real
 * timestamp, so precomputing it for every workspace cost one moment call per
 * workspace on every `workspaceList$` emission.
 */
const getAccessTimeDescription = (accessTimeStamp?: number) =>
  accessTimeStamp
    ? i18n.translate('workspace.picker.accessTime.description', {
        defaultMessage: 'Viewed {timeLabel}',
        values: {
          timeLabel: moment(accessTimeStamp).fromNow(),
        },
      })
    : i18n.translate('workspace.picker.accessTime.not.visited', {
        defaultMessage: 'Not visited recently',
      });
interface Props {
  coreStart: CoreStart;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  onClickWorkspace?: () => void;
  isInTwoLines?: boolean;
}

const sortByRecentVisitedAndAlphabetical = (
  ws1: UpdatedWorkspaceObject,
  ws2: UpdatedWorkspaceObject
) => {
  // First, sort by accessTimeStamp in descending order (if both have timestamps)
  if (ws1?.accessTimeStamp && ws2?.accessTimeStamp) {
    return ws2.accessTimeStamp - ws1.accessTimeStamp;
  }
  // If one has a timestamp and the other does not, prioritize the one with the timestamp
  if (ws1.accessTimeStamp) return -1;
  if (ws2.accessTimeStamp) return 1;
  // If neither has a timestamp, sort alphabetically by name
  return ws1.name.localeCompare(ws2.name);
};

export const WorkspacePickerContent = ({
  coreStart,
  registeredUseCases$,
  onClickWorkspace,
  isInTwoLines,
}: Props) => {
  const isDashboardAdmin = coreStart.application.capabilities?.dashboards?.isDashboardAdmin;
  const availableUseCases = useObservable(registeredUseCases$, []);
  const [search, setSearch] = useState('');
  const workspaceList = useObservable(coreStart.workspaces.workspaceList$, []);

  const updatedRecentWorkspaceList: UpdatedWorkspaceObject[] = useMemo(() => {
    const recentWorkspaces = recentWorkspaceManager.getRecentWorkspaces();
    // Index the recent entries by id: the previous `find` per workspace made this
    // O(workspaces x recents), which is needless work on large workspace lists.
    const timestampById = new Map(recentWorkspaces.map((recent) => [recent.id, recent.timestamp]));
    const updatedList = workspaceList.map((workspace) => ({
      ...workspace,
      accessTimeStamp: timestampById.get(workspace.id),
    }));

    return updatedList.sort(sortByRecentVisitedAndAlphabetical);
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
      const useCaseURL = getUseCaseUrl(
        useCase,
        workspace.id,
        coreStart.application,
        coreStart.http
      );

      const accessTimeDescription = getAccessTimeDescription(workspace.accessTimeStamp);

      return (
        // The key belongs on the outermost element returned into the array — it
        // was previously set on the inner list item, leaving every array child
        // unkeyed and forcing React into positional reconciliation.
        <Fragment key={workspace.id}>
          <EuiHorizontalRule size="full" margin="none" />
          <EuiListGroupItem
            // using inline style to make sure that the list item will be expanded，className="eui-fullWidth" is not working, need to set minWidth
            style={{ width: '100%', minWidth: '0' }}
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
              !isInTwoLines ? (
                <EuiFlexGroup direction="column" gutterSize="none" className="eui-fullWidth">
                  <EuiFlexItem>
                    <EuiText className="eui-textTruncate" size="s">
                      {workspace.name}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiFlexGroup justifyContent="spaceBetween">
                      <EuiFlexItem className="eui-textLeft" grow={false}>
                        <EuiText size="s" color="subdued">
                          <small>{useCase?.title}</small>
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={1} style={{ position: 'absolute', right: '0px' }}>
                        <EuiText size="s" color="subdued">
                          <small> {accessTimeDescription}</small>
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
              ) : (
                <EuiFlexGroup
                  direction="column"
                  gutterSize="none"
                  className="eui-fullWidth"
                  alignItems="flexStart"
                >
                  <EuiFlexItem>
                    <EuiText className="eui-textTruncate" size="s">
                      {workspace.name}
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s" color="subdued">
                      <small>{useCase?.title}</small>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size="s" color="subdued">
                      <small> {accessTimeDescription}</small>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              )
            }
            onClick={() => {
              onClickWorkspace?.();
              window.location.assign(useCaseURL);
            }}
          />
        </Fragment>
      );
    });
    return listItems;
  };

  const getWorkspaceListGroup = (filterWorkspaceList: UpdatedWorkspaceObject[]) => {
    const listItems = getWorkspaceLists(filterWorkspaceList);
    return (
      <>
        <EuiListGroup gutterSize="none">{listItems}</EuiListGroup>
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
        // adding this inline style to make sure that part of list won't be hidden
        style={{ maxHeight: 'calc(100% - 50px)' }}
        className="euiYScrollWithShadows eui-fullWidth"
      >
        {queriedWorkspace.length > 0 && getWorkspaceListGroup(queriedWorkspace)}

        {queriedWorkspace.length === 0 && getEmptyStatePrompt()}
      </EuiPanel>
    </>
  );
};
