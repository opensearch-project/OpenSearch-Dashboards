/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../../framework/types';
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

export const redirectToDiscoverWithDataSrc = (
  datasourceName: string,
  datasourceMDSId: string | undefined,
  databaseName: string,
  tableName: string,
  application: ApplicationStart
) => {
  application.navigateToApp('data-explorer', {
    path: `discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_q=(filters:!(),query:(dataset:(dataSource:(id:'${
      datasourceMDSId ?? ''
    }',meta:(name:${datasourceName},type:CUSTOM),title:'',type:DATA_SOURCE),id:'${
      datasourceMDSId ?? ''
    }::${datasourceName}.${databaseName}.${tableName}',title:${datasourceName}.${databaseName}.${tableName},type:S3),language:SQL,query:'SELECT%20*%20FROM%20${datasourceName}.${databaseName}.${tableName}%20LIMIT%2010'))`,
  });
};

export const redirectToDiscoverOSIdx = (
  indexName: string,
  datasourceMDSId: string | undefined,
  application: ApplicationStart
) => {
  application.navigateToApp('data-explorer', {
    path: `discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(view:discover))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15m,to:now))&_q=(filters:!(),query:(dataset:(dataSource:(id:'${
      datasourceMDSId ?? ''
    }',title:'',type:DATA_SOURCE),id:'${
      datasourceMDSId ?? ''
    }::${indexName}',title:${indexName},type:INDEXES),language:SQL,query:'SELECT%20*%20FROM%20${indexName}%20LIMIT%2010'))`,
  });
};

export const redirectToDiscover = (application: ApplicationStart) => {
  application.navigateToApp('data-explorer', {
    path: `discover#`,
  });
};
