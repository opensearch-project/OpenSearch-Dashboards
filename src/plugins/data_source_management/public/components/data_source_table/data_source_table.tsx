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
  EuiTitle,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { i18n } from '@osd/i18n';
import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { DataSourceManagmentContext } from '../../types';
import { CreateButton } from '../create_button';
import { getDataSources } from '../utils';
import { DataSourceTableItem } from '../types';
import { DataSourceCreationOption } from '../../service';

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

const ariaRegion = i18n.translate('indexPatternManagement.editIndexPatternLiveRegionAriaLabel', {
  defaultMessage: 'Data sources',
});

const title = i18n.translate('indexPatternManagement.indexPatternTable.title', {
  defaultMessage: 'Data sources',
});

interface Props extends RouteComponentProps {
  canSave: boolean;
}

export const DataSourceTable = ({ canSave, history }: Props) => {
  const {
    setBreadcrumbs,
    savedObjects,
    uiSettings,
    dataSourceManagementStart,
    chrome,
    docLinks,
    application,
    http,
    getMlCardState,
    data,
  } = useOpenSearchDashboards<DataSourceManagmentContext>().services;

  const [dataSources, setDataSources] = useState<DataSourceTableItem[]>([]);
  const [creationOptions, setCreationOptions] = useState<DataSourceCreationOption[]>([]);
  const [sources, setSources] = useState<MatchedItem[]>([]);
  const [remoteClustersExist, setRemoteClustersExist] = useState<boolean>(false);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(true);
  const [isLoadingDataSources, setIsLoadingDataSources] = useState<boolean>(true);

  // todo
  // setBreadcrumbs(getListBreadcrumbs());

  useEffect(() => {
    (async function () {
      const options = await dataSourceManagementStart.creation.getDataSourceCreationOptions(
        history.push
      ); // todo
      const gettedDataSources: DataSourceTableItem[] = await getDataSources(
        savedObjects.client,
        uiSettings.get('defaultIndex'),
        dataSourceManagementStart
      );
      setIsLoadingDataSources(false);
      setCreationOptions(options);
      setDataSources(gettedDataSources);
    })();
  }, [
    history.push,
    dataSources.length,
    dataSourceManagementStart,
    uiSettings,
    savedObjects.client,
  ]);

  // const removeAliases = (item: MatchedItem) =>
  //   !((item as unknown) as ResolveIndexResponseItemAlias).indices;

  const searchClient = data.search.search; // this is dependency on data plugin????

  // todo: loadDatasources
  // const loadSources = () => {
  //   getIndices({ http, pattern: '*', searchClient }).then((dataSources) =>
  //     setSources(dataSources.filter(removeAliases))
  //   );
  //   getIndices({ http, pattern: '*:*', searchClient }).then((dataSources) =>
  //     setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
  //   );
  // };

  // useEffect(() => {
  // todo: loadDataSource
  // getIndices({ http, pattern: '*', searchClient }).then((dataSources) => {
  //   setSources(dataSources.filter(removeAliases));
  //   setIsLoadingSources(false);
  // });
  // getIndices({ http, pattern: '*:*', searchClient }).then((dataSources) =>
  //   setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
  // );
  // }, [http, searchClient]);

  chrome.docTitle.change(title);

  const columns = [
    {
      field: 'id', // todo: change to title, aka the name of data source
      name: 'Datasource',
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
          <EuiButtonEmpty size="xs" {...reactRouterNavigate(history, `datasources/${index.id}`)}>
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
  ];

  const createButton = ( // canSave?
    // todo: add creationOptions as method is must have
    <CreateButton options={creationOptions}>
      <FormattedMessage
        id="indexPatternManagement.indexPatternTable.createBtn"
        defaultMessage="Create data source"
      />
    </CreateButton>
  );

  // if (isLoadingSources || isLoadingIndexPatterns) {
  //   return <></>;
  // }

  // const hasDataIndices = sources.some(({ name }: MatchedItem) => !name.startsWith('.'));

  // if (!indexPatterns.length) {
  //   if (!hasDataIndices && !remoteClustersExist) {
  //     return (
  //       <EmptyState
  //         onRefresh={loadSources}
  //         docLinks={docLinks}
  //         navigateToApp={application.navigateToApp}
  //         getMlCardState={getMlCardState}
  //         canSave={canSave}
  //       />
  //     );
  //   } else {
  //     return (
  //       <EmptyIndexPatternPrompt
  //         canSave={canSave}
  //         creationOptions={creationOptions}
  //         docLinksIndexPatternIntro={docLinks.links.indexPatterns.introduction}
  //         setBreadcrumbs={setBreadcrumbs}
  //       />
  //     );
  //   }
  // }

  return (
    <EuiPageContent data-test-subj="indexPatternTable" role="region" aria-label={ariaRegion}>
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>{title}</h2>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText>
            <p>
              <FormattedMessage
                id="indexPatternManagement.indexPatternTable.indexPatternExplanation"
                defaultMessage="Create and manage the data sources that help you retrieve your data from multi Elasticsearch clusters."
              />
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>{createButton}</EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiInMemoryTable
        allowNeutralSort={false}
        itemId="id"
        isSelectable={false}
        items={dataSources}
        columns={columns}
        pagination={pagination}
        sorting={sorting}
        search={search}
      />
    </EuiPageContent>
  );
};

export const DataSourceTableWithRouter = withRouter(DataSourceTable);
