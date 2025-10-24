/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './dataset_table_v2.scss';

import { EuiInMemoryTable, EuiSpacer, EuiPageContent } from '@elastic/eui';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { useEffectOnce, useObservable } from 'react-use';
import { of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../types';
import { getListBreadcrumbs } from '../../breadcrumbs';
import { EmptyState } from '../empty_state';
import { EmptyDatasetPrompt } from '../empty_dataset_prompt';
import { useDatasetTableData, useDatasetSelector } from './hooks';
import { getDatasetTableColumns } from './dataset_table_columns';
import { DatasetTableHeader } from './dataset_table_header';

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

const sorting = {
  sort: {
    field: 'displayName',
    direction: 'asc' as const,
  },
};

const search = {
  box: {
    incremental: true,
    schema: {
      fields: {
        displayName: { type: 'string' },
        title: { type: 'string' },
        signalType: { type: 'string' },
        description: { type: 'string' },
      },
    },
  },
};

const ariaRegion = i18n.translate('datasetManagement.editDatasetLiveRegionAriaLabel', {
  defaultMessage: 'Datasets',
});

const title = i18n.translate('datasetManagement.datasetTable.title', {
  defaultMessage: 'Datasets',
});

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const DatasetTableV2 = ({ canSave, history }: Props) => {
  const { services } = useOpenSearchDashboards<DatasetManagmentContext>();
  const {
    setBreadcrumbs,
    savedObjects,
    uiSettings,
    datasetManagementStart,
    chrome,
    navigationUI: { HeaderControl },
    docLinks,
    application,
    http,
    getMlCardState,
    data,
    dataSourceEnabled,
    workspaces,
    overlays,
    notifications,
  } = services;

  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const [isColumnDataLoaded, setIsColumnDataLoaded] = useState(false);
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const { columns: columnRegistry } = datasetManagementStart;
  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  // Custom hooks
  const {
    datasets,
    isLoadingSources,
    isLoadingDatasets,
    hasDataIndices,
    remoteClustersExist,
    loadSources,
  } = useDatasetTableData({
    savedObjectsClient: savedObjects.client,
    defaultIndex: uiSettings.get('defaultIndex'),
    datasetManagementStart,
    http,
    data,
    dataSourceEnabled,
    historyPush: history.push,
  });

  const { openDatasetSelector } = useDatasetSelector({
    data,
    overlays,
    services,
    notifications,
    historyPush: history.push,
  });

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs(useUpdatedUX ? currentWorkspace?.name : undefined));
  }, [chrome, currentWorkspace, setBreadcrumbs, useUpdatedUX]);

  // Load column data
  useEffectOnce(() => {
    (async () => {
      await Promise.all(columnRegistry.getAll().map((column) => column.loadData()));
      setIsColumnDataLoaded(true);
    })();
  });

  chrome.docTitle.change(title);

  // Generate columns
  const columns = getDatasetTableColumns({
    history,
    useUpdatedUX,
    savedObjectsClient: savedObjects.client,
  });

  // Loading state
  if (isLoadingSources || isLoadingDatasets) {
    return <></>;
  }

  // Empty states
  if (!datasets.length) {
    if (!dataSourceEnabled) {
      if (!hasDataIndices && !remoteClustersExist) {
        return (
          <EmptyState
            onRefresh={loadSources}
            docLinks={docLinks}
            navigateToApp={application.navigateToApp}
            getMlCardState={getMlCardState}
            canSave={canSave}
          />
        );
      }
    } else {
      return (
        <EmptyDatasetPrompt
          canSave={canSave}
          onCreateDataset={openDatasetSelector}
          docLinksDatasetIntro={docLinks.links.noDocumentation.indexPatterns.introduction}
        />
      );
    }
  }

  return (
    <>
      <EuiPageContent
        data-test-subj="datasetTable"
        role="region"
        aria-label={ariaRegion}
        {...(useUpdatedUX ? { paddingSize: 'm' } : {})}
      >
        <DatasetTableHeader
          canSave={canSave}
          useUpdatedUX={useUpdatedUX}
          currentWorkspaceName={currentWorkspace?.name}
          onCreateDataset={openDatasetSelector}
          HeaderControl={HeaderControl}
          setAppRightControls={application.setAppRightControls}
          setAppDescriptionControls={application.setAppDescriptionControls}
        />
        <EuiSpacer />
        <EuiInMemoryTable
          allowNeutralSort={false}
          itemId="id"
          isSelectable={false}
          items={datasets}
          columns={columns}
          pagination={pagination}
          sorting={sorting}
          search={search}
        />
      </EuiPageContent>
    </>
  );
};

export const DatasetTableV2WithRouter = withRouter(DatasetTableV2);
