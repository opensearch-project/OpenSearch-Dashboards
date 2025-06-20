/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import moment from 'moment';
import { DataExplorerServices } from '../../../../../../../../data_explorer/public';

// Extract time range from payload data
export const getTimeRangeFromPayload = (payloadData: any[]) => {
  if (!payloadData || payloadData.length === 0) {
    return {
      startTime: moment().subtract(15, 'minutes').toISOString(),
      endTime: moment().toISOString(),
    };
  }

  let earliestStart: moment.Moment | null = null;
  let latestEnd: moment.Moment | null = null;

  payloadData.forEach((hit) => {
    // Access properties directly on the hit object (flattened structure)
    const startTime = hit.startTime || hit.timestamp;
    const endTime = hit.endTime || hit.timestamp;
    const duration = hit.durationInNanos || hit.duration || 0;

    if (startTime) {
      const start = moment.utc(startTime);

      if (!earliestStart || start.isBefore(earliestStart)) {
        earliestStart = start;
      }

      const end = endTime ? moment.utc(endTime) : start.clone().add(duration, 'microseconds');

      if (!latestEnd || end.isAfter(latestEnd)) {
        latestEnd = end;
      }
    }
  });

  // Add buffer time for telemetry lag (15 minutes on each side) - using ISO format
  const startTime = earliestStart
    ? moment(earliestStart).subtract(15, 'minutes').toISOString()
    : moment().subtract(15, 'minutes').toISOString();

  const endTime = latestEnd
    ? moment(latestEnd).add(15, 'minutes').toISOString()
    : moment().toISOString();
  return { startTime, endTime };
};

export const redirectToLogs = (
  payloadData: any[],
  dataSourceMDSId: Array<{ id: string; label: string }>,
  traceId: string,
  services: DataExplorerServices
) => {
  const { startTime, endTime } = getTimeRangeFromPayload(payloadData);

  // Hardcoded values for logs index and field mappings
  const correlatedLogsIndex = 'logs-otel-v1-000001';
  const correlatedTimestampField = 'time';
  const correlatedTraceIdField = 'traceId';

  // Data source is always enabled - use new navigation approach
  const dataSourceId = dataSourceMDSId[0].id;
  const dataSourceLabel = dataSourceMDSId[0].label || 'DockerTest';

  // Build the path with the correct format
  const path = `logs/#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'${startTime}',to:'${endTime}'))&_q=(dataset:(dataSource:(id:'${dataSourceId}',title:${dataSourceLabel},type:DATA_SOURCE),id:'${dataSourceId}::${correlatedLogsIndex}',isRemoteDataset:!f,timeFieldName:${correlatedTimestampField},title:${correlatedLogsIndex},type:INDEXES),language:PPL,query:'source%20%3D%20${correlatedLogsIndex}%20%7C%20where%20${correlatedTraceIdField}%20%3D%20!'${traceId}!'')&_a=(legacy:(columns:!(_source),interval:auto,isDirty:!f,sort:!()),tab:(),ui:(abortController:!n,activeTabId:logs,error:!n,executionCacheKeys:!(source___${correlatedLogsIndex.replace(
    /-/g,
    '_'
  )}___where_${correlatedTraceIdField}____${traceId}__now_15m_now),status:ready,transaction:(inProgress:!f,pendingActions:!())))`;
  // Use direct window location navigation
  const baseUrl = window.location.href.split('/app/')[0];
  const fullUrl = `${baseUrl}/app/explore/${path}`;
  window.location.href = fullUrl;
};

// TODO See if we can use navigateToApp instead of window loc
// services.application?.navigateToApp('explore', {
//   path: `logs/#/?_g=(time:(from:'${startTime}',to:'${endTime}'))&_q=(dataset:(dataSource:(id:${dataSourceId},title:${dataSourceLabel},type:DATA_SOURCE),id:'${dataSourceId}::${correlatedLogsIndex}',isRemoteDataset:!f,language:PPL,timeFieldName:${correlatedTimestampField},title:${correlatedLogsIndex},type:INDEXES),format:jdbc,language:PPL,query:'${encodeURIComponent(
//     `source = ${correlatedLogsIndex} | where ${correlatedTraceIdField} = "${traceId}"`
//   )}')&_a=(legacy:(columns:!(_source),interval:auto,isDirty:!f,sort:!()),tab:(),ui:(abortController:!n,activeTabId:logs,error:!n,executionCacheKeys:!(source___${correlatedLogsIndex}_now_15m_now),status:ready,transaction:(inProgress:!f,pendingActions:!())))`,
// });
