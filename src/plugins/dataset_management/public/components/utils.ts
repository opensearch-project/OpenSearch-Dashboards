/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataView } from 'src/plugins/data/public';
import { SavedObjectsClientContract } from 'src/core/public';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { DatasetManagementStart } from '../plugin';

// TODO: where is this called
export async function getDatasets(
  savedObjectsClient: SavedObjectsClientContract,
  defaultIndex: string,
  datasetManagementStart: DatasetManagementStart
) {
  return (
    savedObjectsClient
      .find<IDataView>({
        type: 'index-pattern',
        fields: ['title', 'type'],
        perPage: 10000,
      })
      .then((response) =>
        response.savedObjects
          .map((pattern) => {
            const id = pattern.id;
            const title = pattern.get('title');
            const references = pattern.references;
            const isDefault = defaultIndex === id;

            const tags = (datasetManagementStart as DatasetManagementStart).list.getDatasetTags(
              pattern,
              isDefault
            );
            const reference = Array.isArray(references) ? references[0] : undefined;
            const referenceId = reference?.id;

            return {
              id,
              title,
              default: isDefault,
              tags,
              referenceId,
              // the prepending of 0 at the default pattern takes care of prioritization
              // so the sorting will but the default index on top
              // or on bottom of a the table
              sort: `${isDefault ? '0' : '1'}${title}`,
            };
          })
          .sort((a, b) => {
            if (a.sort < b.sort) {
              return -1;
            } else if (a.sort > b.sort) {
              return 1;
            } else {
              return 0;
            }
          })
      ) || []
  );
}

export async function getDataSources(savedObjectsClient: SavedObjectsClientContract) {
  return (
    savedObjectsClient
      .find<DataSourceAttributes>({
        type: 'data-source',
        fields: ['title', 'type', 'dataSourceVersion', 'installedPlugins', 'dataSourceEngineType'],
        perPage: 10000,
      })
      .then((response) =>
        response.savedObjects
          .map((dataSource) => {
            const id = dataSource.id;
            const type = dataSource.type;
            const title = dataSource.get('title');
            const datasourceversion = dataSource.get('dataSourceVersion');
            const installedplugins = dataSource.get('installedPlugins');
            const dataSourceEngineType = dataSource.get('dataSourceEngineType');

            return {
              id,
              title,
              type,
              label: title,
              sort: `${title}`,
              datasourceversion,
              installedplugins,
              engine: dataSourceEngineType,
            };
          })
          .sort((a, b) => a.sort.localeCompare(b.sort))
      ) || []
  );
}
