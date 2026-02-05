/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiSpacer,
  EuiText,
  EuiBadgeGroup,
  EuiPageContent,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiLink,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { useEffectOnce, useObservable } from 'react-use';
import { of } from 'rxjs';
import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../types';
import { CreateButton } from '../create_button';
import { DatasetTableItem, DatasetCreationOption } from '../types';
import { getDatasets } from '../utils';
import { getListBreadcrumbs } from '../breadcrumbs';
import { EmptyState } from './empty_state';
import { MatchedItem, ResolveIndexResponseItemAlias } from '../create_dataset_wizard/types';
import { EmptyDatasetPrompt } from './empty_dataset_prompt';
import { getIndices } from '../create_dataset_wizard/lib';

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

const sorting = {
  sort: {
    field: 'title',
    direction: 'asc' as const,
  },
};

const search = {
  box: {
    incremental: true,
    schema: {
      fields: { title: { type: 'string' } },
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

export const DatasetTable = ({ canSave, history }: Props) => {
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
  } = useOpenSearchDashboards<DatasetManagmentContext>().services;

  const [datasets, setDatasets] = useState<DatasetTableItem[]>([]);
  const [creationOptions, setCreationOptions] = useState<DatasetCreationOption[]>([]);
  const [sources, setSources] = useState<MatchedItem[]>([]);
  const [remoteClustersExist, setRemoteClustersExist] = useState<boolean>(false);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(!dataSourceEnabled);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState<boolean>(true);
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const [isColumnDataLoaded, setIsColumnDataLoaded] = useState(false);

  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const { columns: columnRegistry } = datasetManagementStart;

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');
  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs(useUpdatedUX ? currentWorkspace?.name : undefined));
  }, [chrome, currentWorkspace, setBreadcrumbs, useUpdatedUX]);

  useEffect(() => {
    (async function () {
      const options = await datasetManagementStart.creation.getDatasetCreationOptions(history.push);
      const gettedDatasets: DatasetTableItem[] = await getDatasets(
        savedObjects.client,
        uiSettings.get('defaultIndex'),
        datasetManagementStart
      );
      setIsLoadingDatasets(false);
      setCreationOptions(options);
      setDatasets(gettedDatasets);
    })();
  }, [history.push, datasets.length, datasetManagementStart, uiSettings, savedObjects.client]);

  const removeAliases = (item: MatchedItem) =>
    !((item as unknown) as ResolveIndexResponseItemAlias).indices;

  const searchClient = data.search.search;

  const loadSources = () => {
    getIndices({ http, pattern: '*', searchClient }).then((dataSources) =>
      setSources(dataSources.filter(removeAliases))
    );
    getIndices({ http, pattern: '*:*', searchClient }).then((dataSources) =>
      setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
    );
  };

  const loadColumnData = async () => {
    await Promise.all(columnRegistry.getAll().map((column) => column.loadData()));
    setIsColumnDataLoaded(true);
  };

  useEffect(() => {
    if (!dataSourceEnabled) {
      getIndices({ http, pattern: '*', searchClient }).then((dataSources) => {
        setSources(dataSources.filter(removeAliases));
        setIsLoadingSources(false);
      });
      getIndices({ http, pattern: '*:*', searchClient }).then((dataSources) =>
        setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
      );
    }
  }, [http, creationOptions, searchClient, dataSourceEnabled]);

  useEffectOnce(() => {
    loadColumnData();
  });

  chrome.docTitle.change(title);

  const columns = [
    {
      field: 'title',
      name: 'Pattern',
      render: (
        name: string,
        index: {
          id: string;
          tags?: Array<{
            key: string;
            name: string;
          }>;
        }
      ) => (
        <>
          <EuiButtonEmpty
            size="xs"
            {...reactRouterNavigate(history, `patterns/${index.id}`)}
            {...(useUpdatedUX ? { textProps: { style: { fontWeight: 600 } } } : {})}
          >
            {name}
          </EuiButtonEmpty>
          &emsp;
          <EuiBadgeGroup gutterSize="s">
            {index.tags &&
              index.tags.map(({ key: tagKey, name: tagName }) => (
                <EuiBadge key={tagKey}>{tagName}</EuiBadge>
              ))}
          </EuiBadgeGroup>
        </>
      ),
      dataType: 'string' as const,
      sortable: ({ sort }: { sort: string }) => sort,
    },
    ...columnRegistry.getAll().map((column) => {
      return {
        ...column.euiColumn,
        sortable: false,
        'data-test-subj': `datasetTableColumn-${column.id}`,
      };
    }),
  ];

  const createButton = (() => {
    if (!canSave) return null;

    const button = (
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <CreateButton options={creationOptions}>
        <FormattedMessage
          id="datasetManagement.datasetTable.createBtn"
          defaultMessage="Create index pattern"
        />
      </CreateButton>
    );

    return useUpdatedUX ? (
      <HeaderControl
        controls={[{ renderComponent: button }]}
        setMountPoint={application.setAppRightControls}
      />
    ) : (
      <EuiFlexItem grow={false}>{button}</EuiFlexItem>
    );
  })();

  const description = currentWorkspace
    ? i18n.translate('datasetManagement.datasetTable.datasetExplanationWithWorkspace', {
        defaultMessage:
          'Create and manage the datasets that help you retrieve your data from OpenSearch for {name} workspace.',
        values: {
          name: currentWorkspace.name,
        },
      })
    : i18n.translate('datasetManagement.datasetTable.datasetExplanation', {
        defaultMessage:
          'Create and manage the datasets that help you retrieve your data from OpenSearch.',
      });
  const pageTitleAndDescription = useUpdatedUX ? (
    <HeaderControl
      controls={[{ description }]}
      setMountPoint={application.setAppDescriptionControls}
    />
  ) : (
    <EuiFlexItem grow={false}>
      <EuiText size="s">
        <h1>{title}</h1>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiText size="s">
        <p>{description}</p>
      </EuiText>
    </EuiFlexItem>
  );

  if (isLoadingSources || isLoadingDatasets) {
    return <></>;
  }

  const hasDataIndices = sources.some(({ name }: MatchedItem) => !name.startsWith('.'));

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
          creationOptions={creationOptions}
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
        <EuiFlexGroup justifyContent="spaceBetween">
          {pageTitleAndDescription}
          {createButton}
        </EuiFlexGroup>
        <EuiSpacer />
        <EuiInMemoryTable
          allowNeutralSort={false}
          itemId="id"
          isSelectable={false}
          items={datasets}
          // @ts-expect-error TS2322 TODO(ts-error): fixme
          columns={columns}
          pagination={pagination}
          sorting={sorting}
          search={search}
        />
      </EuiPageContent>
    </>
  );
};

export const DatasetTableWithRouter = withRouter(DatasetTable);
