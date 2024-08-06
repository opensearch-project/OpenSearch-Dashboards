/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageContent,
  EuiLink,
  EuiSmallButton,
  EuiInMemoryTable,
  EuiToolTip,
  EuiText,
  EuiSearchBarProps,
  EuiCopy,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiTableSelectionType,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { BehaviorSubject, of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { debounce, DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { WorkspaceAttribute } from '../../../../../core/public';
import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';
import { navigateToWorkspaceDetail } from '../utils/workspace';

import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';

import { cleanWorkspaceId } from '../../../../../core/public';
import { DeleteWorkspaceModal } from '../delete_workspace_modal';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';
import { WorkspaceUseCase } from '../../types';

const WORKSPACE_LIST_PAGE_DESCRIPTION = i18n.translate('workspace.list.description', {
  defaultMessage:
    'Workspace allow you to save and organize library items, such as index patterns, visualizations, dashboards, saved searches, and share them with other OpenSearch Dashboards users. You can control which features are visible in each workspace, and which users and groups have read and write access to the library items in the workspace.',
});

export interface WorkspaceListProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceList = ({ registeredUseCases$ }: WorkspaceListProps) => {
  const {
    services: { workspaces, application, http },
  } = useOpenSearchDashboards();
  const registeredUseCases = useObservable(registeredUseCases$);
  const isDashboardAdmin = application?.capabilities?.dashboards?.isDashboardAdmin;
  const initialSortField = 'name';
  const initialSortDirection = 'asc';
  const workspaceList = useObservable(workspaces?.workspaceList$ ?? of([]), []);
  const [queryInput, setQueryInput] = useState<string>('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
    pageSizeOptions: [5, 10, 20],
  });
  const [deletedWorkspace, setDeletedWorkspace] = useState<WorkspaceAttribute | null>(null);
  const [featureFilters, setFeatureFilters] = useState<string[]>([]);
  const workspaceCreateUrl = useMemo(() => {
    if (!application || !http) {
      return '';
    }

    const appUrl = application.getUrlForApp(WORKSPACE_CREATE_APP_ID, {
      absolute: false,
    });
    if (!appUrl) return '';

    return cleanWorkspaceId(appUrl);
  }, [application, http]);

  const [message, setMessage] = useState<React.ReactNode>(
    <EuiEmptyPrompt
      iconType="spacesApp"
      title={<h3>No workspace available</h3>}
      titleSize="s"
      body="There are no workspace to display. Create workspace to get started."
      actions={
        isDashboardAdmin && (
          <EuiSmallButton
            href={workspaceCreateUrl}
            key="create_workspace"
            data-test-subj="workspaceList-create-workspace"
          >
            {i18n.translate('workspace.workspaceList.buttons.createWorkspace', {
              defaultMessage: 'Create workspace',
            })}
          </EuiSmallButton>
        )
      }
    />
  );

  const handleSwitchWorkspace = useCallback(
    (id: string) => {
      if (application && http) {
        navigateToWorkspaceDetail({ application, http }, id);
      }
    },
    [application, http]
  );

  const formatDate = function (dateString: string) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const date = new Date(dateString);

    const month = months[date.getUTCMonth()];
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

    return `${month} ${day},${year}@${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  const addFeatureFilter = (newFeature: string) => {
    setFeatureFilters((prevFilters) => {
      if (!prevFilters.includes(newFeature)) {
        return [...prevFilters, newFeature];
      }
      return prevFilters;
    });
  };

  // const debouncedSetQueryInput = useMemo(() => {
  //   return debounce(setQueryInput, 300);
  // }, [setQueryInput]);

  // const handleSearchInput: EuiSearchBarProps['onChange'] = useCallback(
  //   ({ query }) => {
  //     debouncedSetQueryInput(query?.text ?? '');
  //   },
  //   [debouncedSetQueryInput]
  // );

  const transformIDtoName = (useCaseId: string) => {
    const useCase =
      useCaseId === DEFAULT_NAV_GROUPS.all.id
        ? DEFAULT_NAV_GROUPS.all
        : registeredUseCases?.find(({ id }) => id === useCaseId);

    // eslint-disable-next-line
    console.log('useCase', useCase);
    return useCase?.title;
  };
  const search: EuiSearchBarProps = {
    box: {
      incremental: true,
    },
    filters: [
      {
        type: 'field_value_selection',
        field: 'features',
        name: 'Use Case',
        multiSelect: false,
        options: featureFilters.map((feature) => ({
          value: feature,
          name: transformIDtoName(feature),
        })),
      },
    ],
    toolsRight: [
      ...(isDashboardAdmin
        ? [
            <EuiSmallButton
              href={workspaceCreateUrl}
              key="create_workspace"
              data-test-subj="workspaceList-create-workspace"
            >
              {i18n.translate('workspace.workspaceList.buttons.createWorkspace', {
                defaultMessage: 'Create workspace',
              })}
            </EuiSmallButton>,
          ]
        : []),
    ],
  };

  // const searchResult = useMemo(() => {
  //   const filterQuery =
  //     queryInput && queryInput.trim().startsWith('features:')
  //       ? queryInput
  //           .trim()
  //           .split(':')[1]
  //           .toLowerCase()
  //           .replace(/^['"]+|['"]+$/g, '')
  //       : '';

  //   // if (filterQuery !== '') setQueryInput('');
  //   const normalizedQuery = queryInput.toLowerCase();

  //   const result = workspaceList.filter((item) => {
  //     const useCaseId = getFirstUseCaseOfFeatureConfigs(item.features || []);
  //     const useCase =
  //       useCaseId === DEFAULT_NAV_GROUPS.all.id
  //         ? DEFAULT_NAV_GROUPS.all
  //         : registeredUseCases?.find(({ id }) => id === useCaseId);

  //     // eslint-disable-next-line
  //     console.log('useCase', useCase);

  //     const filterResult = filterQuery ? useCase?.title.toLowerCase() === filterQuery : true;
  //     const queryResult =
  //       queryInput && !queryInput.startsWith('features:')
  //         ? item.name.toLowerCase().includes(normalizedQuery)
  //         : true;
  //     return filterResult && queryResult;
  //   });
  //   if (result.length === 0 && workspaceList.length > 0) {
  //     setMessage(
  //       <EuiEmptyPrompt
  //         title={<h3>No workspace found</h3>}
  //         titleSize="s"
  //         body="No workspace found with the current search criteria."
  //       />
  //     );
  //   }
  //   return result;
  // }, [workspaceList, queryInput, registeredUseCases]);

  // const searchResult = useMemo(() => {
  //   if (queryInput) {
  //     const normalizedQuery = queryInput.toLowerCase();
  //     const result = workspaceList.filter((item) => {
  //       return item.name.toLowerCase().indexOf(normalizedQuery) > -1;
  //     });
  //     return result;
  //   }
  //   return workspaceList;
  // }, [workspaceList, queryInput]);

  const columns = [
    {
      field: 'name',
      name: 'Name',
      width: '25%',
      sortable: true,
      render: (name: string, item: WorkspaceAttribute) => (
        <span>
          <EuiLink onClick={() => handleSwitchWorkspace(item.id)}>
            <EuiLink>{name}</EuiLink>
          </EuiLink>
        </span>
      ),
    },

    {
      field: 'features',
      name: 'Use case',
      width: '20%',
      isExpander: true,
      hasActions: true,
      render: (features: string[]) => {
        if (!features || features.length === 0) {
          return '';
        }
        const useCaseId = getFirstUseCaseOfFeatureConfigs(features);
        if (useCaseId) {
          addFeatureFilter(useCaseId);
        }
        const useCase =
          useCaseId === DEFAULT_NAV_GROUPS.all.id
            ? DEFAULT_NAV_GROUPS.all
            : registeredUseCases?.find(({ id }) => id === useCaseId);
        if (useCase) {
          return useCase.title;
        }
      },
    },

    {
      field: 'description',
      name: 'Description',
      width: '20%',
      // truncateText: true,
      render: (description: string) => (
        <EuiToolTip position="bottom" content={description}>
          <div
            style={{
              maxWidth: '130px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <EuiText size="s" className="eui-textTruncate">
              {description}
            </EuiText>
          </div>
        </EuiToolTip>
      ),
    },
    {
      field: 'lastUpdatedTime',
      name: 'Last updated',
      width: '25%',
      truncateText: false,
      render: (lastUpdatedTime: string) => {
        return formatDate(lastUpdatedTime);
      },
    },

    {
      name: 'Actions',
      field: '',
      actions: [
        {
          name: 'Copy ID',
          type: 'button',
          description: 'Copy id',
          'data-test-subj': 'workspace-list-copy-id-icon',
          render: ({ id }: WorkspaceAttribute) => {
            return (
              <EuiCopy textToCopy={id}>
                {(copy) => (
                  <EuiButtonEmpty onClick={copy} iconType="copy" color="text">
                    <EuiText size="m">Copy</EuiText>
                  </EuiButtonEmpty>
                )}
              </EuiCopy>
            );
          },
        },
        {
          name: 'Edit',
          type: 'button',
          description: 'Edit workspace',
          'data-test-subj': 'workspace-list-edit-icon',
          render: ({ id }: WorkspaceAttribute) => {
            return (
              <EuiButtonEmpty
                onClick={() => handleSwitchWorkspace(id)}
                iconType="pencil"
                color="text"
              >
                <EuiText size="m">Edit</EuiText>
              </EuiButtonEmpty>
            );
          },
        },
        {
          name: 'Delete',
          type: 'button',
          description: 'Delete workspace',
          'data-test-subj': 'workspace-list-delete-icon',
          render: (item: WorkspaceAttribute) => {
            return (
              <EuiButtonEmpty
                onClick={() => {
                  setDeletedWorkspace(item);
                }}
                iconType="trash"
                color="danger"
              >
                <EuiText size="m">Delete</EuiText>
              </EuiButtonEmpty>
            );
          },
        },
      ],
    },
  ];

  useEffect(() => {
    setFeatureFilters([]);
    workspaceList.forEach((workspace) => {
      // eslint-disable-next-line
      console.log('workspacelist', workspaceList);
      const useCaseId = getFirstUseCaseOfFeatureConfigs(workspace.features || []);
      if (useCaseId) {
        addFeatureFilter(useCaseId);
      }
    });
    if (workspaceList && workspaceList.length === 0) {
      setMessage(
        <EuiEmptyPrompt
          iconType="spacesApp"
          title={<h3>No workspace available</h3>}
          titleSize="s"
          body="There are no workspace to display. Create workspace to get started."
          actions={
            isDashboardAdmin && (
              <EuiSmallButton
                href={workspaceCreateUrl}
                key="create_workspace"
                data-test-subj="workspaceList-create-workspace"
              >
                {i18n.translate('workspace.workspaceList.buttons.createWorkspace', {
                  defaultMessage: 'Create workspace',
                })}
              </EuiSmallButton>
            )
          }
        />
      );
    }
  }, [workspaceList, registeredUseCases, message, isDashboardAdmin, workspaceCreateUrl]);

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader
          restrictWidth
          pageTitle="Workspaces"
          description={WORKSPACE_LIST_PAGE_DESCRIPTION}
          style={{ paddingBottom: 0, borderBottom: 0 }}
        />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          panelPaddingSize="l"
          hasShadow={false}
          style={{ width: '100%' }}
        >
          <EuiInMemoryTable
            items={workspaceList}
            columns={columns}
            itemId="id"
            message={message}
            onTableChange={({ page: { index, size } }) =>
              setPagination((prev) => {
                return { ...prev, pageIndex: index, pageSize: size };
              })
            }
            pagination={pagination}
            sorting={{
              sort: {
                field: initialSortField,
                direction: initialSortDirection,
              },
            }}
            isSelectable={true}
            search={search}
          />
        </EuiPageContent>
      </EuiPageBody>
      {deletedWorkspace && (
        <DeleteWorkspaceModal
          selectedWorkspace={deletedWorkspace}
          onClose={() => setDeletedWorkspace(null)}
        />
      )}
    </EuiPage>
  );
};
