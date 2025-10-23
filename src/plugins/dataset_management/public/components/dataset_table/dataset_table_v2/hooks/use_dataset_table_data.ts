/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { HttpStart } from 'opensearch-dashboards/public';
import { DataPublicPluginStart } from '../../../../../../data/public';
import { DatasetManagementStart } from '../../../../plugin';
import { DatasetTableItem, DatasetCreationOption } from '../../../types';
import { getDatasets } from '../../../utils';
import { MatchedItem, ResolveIndexResponseItemAlias } from '../../../create_dataset_wizard/types';
import { getIndices } from '../../../create_dataset_wizard/lib';

interface UseDatasetTableDataParams {
  savedObjectsClient: SavedObjectsClientContract;
  defaultIndex: string;
  datasetManagementStart: DatasetManagementStart;
  http: HttpStart;
  data: DataPublicPluginStart;
  dataSourceEnabled: boolean;
  historyPush: (path: string) => void;
}

export const useDatasetTableData = ({
  savedObjectsClient,
  defaultIndex,
  datasetManagementStart,
  http,
  data,
  dataSourceEnabled,
  historyPush,
}: UseDatasetTableDataParams) => {
  const [datasets, setDatasets] = useState<DatasetTableItem[]>([]);
  const [creationOptions, setCreationOptions] = useState<DatasetCreationOption[]>([]);
  const [sources, setSources] = useState<MatchedItem[]>([]);
  const [remoteClustersExist, setRemoteClustersExist] = useState<boolean>(false);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(!dataSourceEnabled);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState<boolean>(true);

  const searchClient = data.search.search;

  const removeAliases = (item: MatchedItem) =>
    !((item as unknown) as ResolveIndexResponseItemAlias).indices;

  const loadSources = () => {
    getIndices({ http, pattern: '*', searchClient }).then((dataSources) =>
      setSources(dataSources.filter(removeAliases))
    );
    getIndices({ http, pattern: '*:*', searchClient }).then((dataSources) =>
      setRemoteClustersExist(!!dataSources.filter(removeAliases).length)
    );
  };

  // Load datasets and creation options
  useEffect(() => {
    (async function () {
      const options = await datasetManagementStart.creation.getDatasetCreationOptions(historyPush);
      const gettedDatasets: DatasetTableItem[] = await getDatasets(
        savedObjectsClient,
        defaultIndex,
        datasetManagementStart
      );
      setIsLoadingDatasets(false);
      setCreationOptions(options);
      setDatasets(gettedDatasets);
    })();
  }, [historyPush, datasets.length, datasetManagementStart, defaultIndex, savedObjectsClient]);

  // Load sources if data source is not enabled
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

  const hasDataIndices = sources.some(({ name }: MatchedItem) => !name.startsWith('.'));

  return {
    datasets,
    creationOptions,
    sources,
    remoteClustersExist,
    isLoadingSources,
    isLoadingDatasets,
    hasDataIndices,
    loadSources,
  };
};
