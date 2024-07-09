/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { coreRefs } from '../../../../../../framework/core_refs';
import { DirectQueryLoadingStatus } from '../../../../../../../common/types/explorer';
import {
  DATA_SOURCE_TYPES,
  DEFAULT_DATA_SOURCE_NAME,
  DEFAULT_DATA_SOURCE_TYPE,
} from '../../../../../framework/constants';
import { observabilityLogsID } from '../../../../../framework/utils/shared';

export const ASSC_OBJ_TABLE_SUBJ = 'associatedObjectsTable';

export const ASSC_OBJ_TABLE_ACC_COLUMN_NAME = 'accelerations';

export const ASSC_OBJ_TABLE_SEARCH_HINT = 'Search for objects';

export const ASSC_OBJ_PANEL_TITLE = 'Associated objects';

export const ASSC_OBJ_PANEL_DESCRIPTION = 'Manage objects associated with this data sources.';

export const ASSC_OBJ_NO_DATA_TITLE = 'You have no associated objects';

export const ASSC_OBJ_NO_DATA_DESCRIPTION =
  'Add or config tables from your data source or use Query Workbench.';

export const ASSC_OBJ_REFRESH_BTN = 'Refresh';

export const ASSC_OBJ_FRESH_MSG = 'Last updated at:';

export const ACCE_NO_DATA_TITLE = 'You have no accelerations';

export const ACCE_NO_DATA_DESCRIPTION = 'Accelerate query performing through OpenSearch Indexing';

export const CREATE_ACCELERATION_DESCRIPTION = 'Create Acceleration';

// export const onAccelerateButtonClick = (tableDetail: any) => {
//   // TODO: create acceleration of this table
//   console.log('accelerating', tableDetail.name);
// };

// export const onDeleteButtonClick = (tableDetail: any) => {
//   // TODO: delete table
//   console.log('deleting', tableDetail.name);
// };

const catalogCacheFetchingStatus = [
  DirectQueryLoadingStatus.RUNNING,
  DirectQueryLoadingStatus.WAITING,
  DirectQueryLoadingStatus.SCHEDULED,
];

export const isCatalogCacheFetching = (...statuses: DirectQueryLoadingStatus[]) => {
  return statuses.some((status: DirectQueryLoadingStatus) =>
    catalogCacheFetchingStatus.includes(status)
  );
};

// export const redirectToExplorerWithDataSrc = (
//   datasourceName: string,
//   datasourceType: string,
//   databaseName: string,
//   tableName: string
// ) => {
//   const queryIndex = `${datasourceName}.${databaseName}.${tableName}`;
//   redirectToExplorerWithQuery(datasourceName, datasourceType, queryIndex);
// };

// export const redirectToExplorerOSIdx = (indexName: string) => {
//   redirectToExplorerWithQuery(DEFAULT_DATA_SOURCE_NAME, DEFAULT_DATA_SOURCE_TYPE, indexName);
// };

// export const redirectToExplorerS3 = (datasourceName: string) => {
//   coreRefs?.application!.navigateToApp(observabilityLogsID, {
//     path: `#/explorer`,
//     state: {
//       datasourceName,
//       datasourceType: DATA_SOURCE_TYPES.S3Glue,
//     },
//   });
// };

// const redirectToExplorerWithQuery = (
//   datasourceName: string,
//   datasourceType: string,
//   queriedIndex: string
// ) => {
//   // navigate to explorer
//   coreRefs?.application!.navigateToApp(observabilityLogsID, {
//     path: `#/explorer`,
//     state: {
//       datasourceName,
//       datasourceType,
//       queryToRun: `source = ${queriedIndex} | head 10`,
//     },
//   });
// };
