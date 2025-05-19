/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'src/core/public';
import { DataStructure, DataStructureMeta } from '../../../../../common';
import { getQueryService } from '../../../../services';
/**
 * Inject {@link DataStructureMeta} to DataStructures based on
 * {@link QueryEditorExtensions}.
 *
 * This function combines the meta fields from QueryEditorExtensions and
 * provided data structures. Lower extension order is higher priority, and
 * existing meta fields have highest priority.
 *
 * @param dataStructures - {@link DataStructure}
 * @param selectDataSourceId - function to get data source id given a data structure
 * @returns data structures with meta
 */
export const injectMetaToDataStructures = async (
  dataStructures: DataStructure[],
  selectDataSourceId: (dataStructure: DataStructure) => string | undefined = (
    dataStructure: DataStructure
  ) => dataStructure.id
) => {
  const queryEditorExtensions = Object.values(
    getQueryService().queryString.getLanguageService().getQueryEditorExtensionMap()
  );
  queryEditorExtensions.sort((a, b) => b.order - a.order);

  return Promise.all(
    dataStructures.map(async (dataStructure) => {
      const metaArray = await Promise.allSettled(
        queryEditorExtensions.map((curr) =>
          curr.getDataStructureMeta?.(selectDataSourceId(dataStructure))
        )
      ).then((settledResults) =>
        settledResults
          .filter(
            <T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> =>
              result.status === 'fulfilled'
          )
          .map((result) => result.value)
      );
      const meta = metaArray.reduce(
        (acc, curr) => (acc || curr ? ({ ...acc, ...curr } as DataStructureMeta) : undefined),
        undefined
      );
      if (meta || dataStructure.meta) {
        dataStructure.meta = { ...meta, ...dataStructure.meta } as DataStructureMeta;
      }
      return dataStructure;
    })
  );
};

export const getRemoteClusterConnections = async (dataSourceId: string, http: HttpSetup) => {
  try {
    const response = await http.get(`/api/enhancements/remote_cluster/list`, {
      query: {
        dataSourceId: dataSourceId ?? null,
      },
    });

    return {
      parentId: dataSourceId,
      connectionsAliases: response.map(
        (remoteClusterConnection: { connectionAlias: any }) =>
          remoteClusterConnection.connectionAlias
      ),
    };
  } catch (error) {
    // returning a empty connections array in case of failures
    return [];
  }
};

export const getRemoteClusterIndices = async (
  dataSourceId: string,
  http: HttpSetup,
  connectionAlias: string
): Promise<string[]> => {
  try {
    const response = await http.get(`/api/enhancements/remote_cluster/indexes`, {
      query: {
        dataSourceId,
        connectionAlias,
      },
    });

    return response;
  } catch (error) {
    // returning a empty index array in case of failures
    return [];
  }
};
