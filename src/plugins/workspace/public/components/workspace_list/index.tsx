/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  EuiPage,
  EuiPageBody,
  copyToClipboard,
  EuiComboBoxOptionOption,
  EuiPageHeader,
  EuiPageContent,
  EuiLink,
  EuiIcon,
  EuiTableSelectionType,
  EuiFilterButton,
  EuiSelect,
  EuiComboBox,
  EuiSmallButton,
  EuiInMemoryTable,
  EuiToolTip,
  EuiText,
  EuiSearchBarProps,
  EuiCopy,
  EuiButtonEmpty,
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
  const [filterByFeature, setFilterByFeature] = useState<string | null>(null);
  // eslint-disable-next-line
  console.log('workspaceList', workspaceList);

  // eslint-disable-next-line
  console.log('featureFilters', featureFilters);

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

  // const handleCopyId = (id: string) => {
  //   copyToClipboard(id);
  // };

  const addFeatureFilter = (newFeature: string) => {
    setFeatureFilters((prevFilters) => {
      if (!prevFilters.includes(newFeature)) {
        return [...prevFilters, newFeature];
      }
      return prevFilters;
    });
  };

  const searchResult = useMemo(() => {
    const normalizedQuery = queryInput.toLowerCase();

    return workspaceList.filter((item) => {
      const useCaseId = getFirstUseCaseOfFeatureConfigs(item.features || []);
      const useCase =
        useCaseId === DEFAULT_NAV_GROUPS.all.id
          ? DEFAULT_NAV_GROUPS.all
          : registeredUseCases?.find(({ id }) => id === useCaseId);

      const filterResult = filterByFeature ? useCase?.title === filterByFeature : true;
      const QueryResult = queryInput ? item.name.toLowerCase().includes(normalizedQuery) : true;

      return filterResult && QueryResult;
    });
  }, [workspaceList, filterByFeature, queryInput, registeredUseCases]);
  // if (queryInput) {
  //   const normalizedQuery = queryInput.toLowerCase();
  //   const result = workspaceList.filter((item) => {
  //     return (
  //       item.id.toLowerCase().indexOf(normalizedQuery) > -1 ||
  //       item.name.toLowerCase().indexOf(normalizedQuery) > -1
  //     );
  //   });
  //   return result;
  // }
  // return workspaceList;
  // }, [workspaceList, queryInput, filterByFeature, registeredUseCases]);

  // const filteredByFeatureResult = useMemo(() => {
  //   if (filterByFeature) {
  //     return workspaceList.filter((item) => item.features?.includes(filterByFeature));
  //   }
  //   return workspaceList;
  // }, [workspaceList, filterByFeature]);

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
        const useCase =
          useCaseId === DEFAULT_NAV_GROUPS.all.id
            ? DEFAULT_NAV_GROUPS.all
            : registeredUseCases?.find(({ id }) => id === useCaseId);
        if (useCase) {
          addFeatureFilter(useCase.title);
          // eslint-disable-next-line
          console.log('use case', useCase);
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
          // icon: 'pencil',
          type: 'button',
          description: 'Edit workspace',
          // onClick: ({ id }: WorkspaceAttribute) => handleSwitchWorkspace(id),
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
          // icon: 'trash',
          // color: 'danger',
          type: 'button',
          description: 'Delete workspace',
          // onClick: (item: WorkspaceAttribute) => setDeletedWorkspace(item),
          'data-test-subj': 'workspace-list-delete-icon',
          render: (item: WorkspaceAttribute) => {
            return (
              <EuiButtonEmpty
                onClick={() => setDeletedWorkspace(item)}
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

  const debouncedSetQueryInput = useMemo(() => {
    return debounce(setQueryInput, 300);
  }, [setQueryInput]);

  const handleSearchInput: EuiSearchBarProps['onChange'] = useCallback(
    ({ query }) => {
      debouncedSetQueryInput(query?.text ?? '');
    },
    [debouncedSetQueryInput]
  );

  const handleSelectChange = (selectedOptions: EuiComboBoxOptionOption[]) => {
    setFilterByFeature(selectedOptions.length > 0 ? selectedOptions[0].label : '');
  };

  const comboBoxOptions = featureFilters.map((feature) => ({ label: feature }));

  const search: EuiSearchBarProps = {
    onChange: handleSearchInput,
    box: {
      incremental: false,
    },
    toolsRight: [
      <EuiComboBox
        style={{ width: '200px' }}
        placeholder="Use Case"
        isClearable={true}
        options={comboBoxOptions}
        selectedOptions={filterByFeature ? [{ label: filterByFeature }] : []}
        singleSelection={{ asPlainText: true }}
        // options={[
        //   { value: '', text: 'Use Case', disabled: true }, // Placeholder option
        //   ...featureFilters.map((feature) => ({ value: feature, text: feature })),
        // ]}
        // options={featureFilters.map((feature) => ({ value: feature, text: feature }))}
        onChange={handleSelectChange}
      />,
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

  // const selectionValue: EuiTableSelectionType<WorkspaceAttribute> = {
  //   onSelectionChange: (selection: WorkspaceAttribute[]) => {
  //     setSelectionFilteredByFeatures(selection);
  //   },
  // };
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
            items={searchResult}
            columns={columns}
            itemId="id"
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
