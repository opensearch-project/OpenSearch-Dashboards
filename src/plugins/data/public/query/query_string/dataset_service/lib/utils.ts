/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
