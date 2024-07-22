/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CreateAccelerationForm,
  GroupByTumbleType,
  MaterializedViewColumn,
  SkippingIndexRowType,
} from '../../../../../framework/types';
import { pluralizeTime } from '../create/utils';

/* Add index options to query */
export const buildIndexOptions = (accelerationformData: CreateAccelerationForm) => {
  const {
    primaryShardsCount,
    replicaShardsCount,
    refreshType,
    checkpointLocation,
    accelerationIndexType,
  } = accelerationformData;
  const indexOptions: string[] = [];

  // Add index settings option
  indexOptions.push(
    `index_settings = '{"number_of_shards":${primaryShardsCount},"number_of_replicas":${replicaShardsCount}}'`
  );

  // Add auto refresh option
  indexOptions.push(`auto_refresh = ${['auto', 'autoInterval'].includes(refreshType)}`);

  // Add refresh interval option
  if (refreshType === 'autoInterval') {
    const { refreshWindow, refreshInterval } = accelerationformData.refreshIntervalOptions;
    indexOptions.push(
      `refresh_interval = '${refreshWindow} ${refreshInterval}${pluralizeTime(refreshWindow)}'`
    );
  }

  // Add increment option
  if (refreshType === 'manualIncrement') {
    indexOptions.push(`incremental_refresh = true`);
  }

  // Add manual full refresh option
  if (refreshType === 'manual') {
    indexOptions.push(`incremental_refresh = false`);
  }

  // Add watermark delay option with materialized view
  if (accelerationIndexType === 'materialized') {
    const { delayWindow, delayInterval } = accelerationformData.watermarkDelay;
    indexOptions.push(
      `watermark_delay = '${delayWindow} ${delayInterval}${pluralizeTime(delayWindow)}'`
    );
  }

  if (refreshType !== 'manual' && checkpointLocation) {
    // Add checkpoint location option
    indexOptions.push(`checkpoint_location = '${checkpointLocation}'`);
  }

  // Combine all options with commas and return as a single string
  return `WITH (\n${indexOptions.join(',\n')}\n)`;
};

/* Add skipping index columns to query */
const buildSkippingIndexColumns = (skippingIndexQueryData: SkippingIndexRowType[]) => {
  return skippingIndexQueryData
    .map((n) => `   \`${n.fieldName}\` ${n.accelerationMethod}`)
    .join(', \n');
};

/*
 * Builds create skipping index query
 * Skipping Index create query example:
 *
 * CREATE SKIPPING INDEX
 * ON datasource.database.table (
 *    `field1` VALUE_SET,
 *    `field2` PARTITION,
 *    `field3` MIN_MAX,
 * ) WITH (
 * auto_refresh = true,
 * refresh_interval = '1 minute',
 * checkpoint_location = 's3://test/',
 * index_settings = '{"number_of_shards":9,"number_of_replicas":2}'
 * )
 */
export const skippingIndexQueryBuilder = (accelerationformData: CreateAccelerationForm) => {
  const { dataSource, database, dataTable, skippingIndexQueryData } = accelerationformData;

  const codeQuery = `CREATE SKIPPING INDEX
ON ${dataSource}.${database}.${dataTable} (
${buildSkippingIndexColumns(skippingIndexQueryData)}
  ) ${buildIndexOptions(accelerationformData)}`;

  return codeQuery;
};

/* Add covering index columns to query */
const buildCoveringIndexColumns = (coveringIndexQueryData: string[]) => {
  return coveringIndexQueryData.map((field) => `   \`${field}\``).join(', \n');
};

/*
 * Builds create covering index query
 * Covering Index create query example:
 *
 * CREATE INDEX index_name
 * ON datasource.database.table (
 *    `field1`,
 *    `field2`,
 *    `field3`,
 * ) WITH (
 * auto_refresh = true,
 * refresh_interval = '1 minute',
 * checkpoint_location = 's3://test/',
 * index_settings = '{"number_of_shards":9,"number_of_replicas":2}'
 * )
 */
export const coveringIndexQueryBuilder = (accelerationformData: CreateAccelerationForm) => {
  const {
    dataSource,
    database,
    dataTable,
    accelerationIndexName,
    coveringIndexQueryData,
  } = accelerationformData;

  const codeQuery = `CREATE INDEX ${accelerationIndexName}
ON ${dataSource}.${database}.${dataTable} (
${buildCoveringIndexColumns(coveringIndexQueryData)}
  ) ${buildIndexOptions(accelerationformData)}`;

  return codeQuery;
};

const buildMaterializedViewColumnName = (columnName: string) => {
  return columnName === '*' ? columnName : `\`${columnName}\``;
};

const buildMaterializedViewColumns = (columnsValues: MaterializedViewColumn[]) => {
  return columnsValues
    .map(
      (column) =>
        `   ${
          column.functionName !== 'window.start'
            ? `${column.functionName}(${buildMaterializedViewColumnName(column.functionParam!)})`
            : `${column.functionName}`
        }${column.fieldAlias ? ` AS \`${column.fieldAlias}\`` : ``}`
    )
    .join(', \n');
};

/* Build group by tumble values */
const buildTumbleValue = (GroupByTumbleValue: GroupByTumbleType) => {
  const { timeField, tumbleWindow, tumbleInterval } = GroupByTumbleValue;
  return `(\`${timeField}\`, '${tumbleWindow} ${tumbleInterval}${pluralizeTime(tumbleWindow)}')`;
};

/*
 * Builds create materialized view query
 * Materialized View create query example:
 *
 * CREATE MATERIALIZED VIEW datasource.database.index_name
 * AS SELECT
 * count(`field`) as `counter`,
 * count(*) as `counter1`,
 * sum(`field2`),
 * avg(`field3`) as `average`,
 * window.start as start,
 *  WITH (
 * auto_refresh = true,
 * refresh_interval = '1 minute',
 * checkpoint_location = 's3://test/',
 * index_settings = '{"number_of_shards":9,"number_of_replicas":2}'
 * )
 */
export const materializedQueryViewBuilder = (accelerationformData: CreateAccelerationForm) => {
  const {
    dataSource,
    database,
    dataTable,
    accelerationIndexName,
    materializedViewQueryData,
  } = accelerationformData;

  const codeQuery = `CREATE MATERIALIZED VIEW ${dataSource}.${database}.${accelerationIndexName}
AS SELECT
${buildMaterializedViewColumns(materializedViewQueryData.columnsValues)}
FROM ${dataSource}.${database}.${dataTable}
GROUP BY TUMBLE ${buildTumbleValue(materializedViewQueryData.groupByTumbleValue)}
 ${buildIndexOptions(accelerationformData)}`;

  return codeQuery;
};

/* Builds create acceleration index query */
export const accelerationQueryBuilder = (accelerationformData: CreateAccelerationForm) => {
  switch (accelerationformData.accelerationIndexType) {
    case 'skipping': {
      return skippingIndexQueryBuilder(accelerationformData);
    }
    case 'covering': {
      return coveringIndexQueryBuilder(accelerationformData);
    }
    case 'materialized': {
      return materializedQueryViewBuilder(accelerationformData);
    }
    default: {
      return '';
    }
  }
};
