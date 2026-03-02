/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  resolveServiceName,
  resolveStartTime,
  resolveEndTime,
  resolveDuration,
  resolveInstrumentationScope,
  resolveServiceNameFromDatarows,
  resolveStartTimeFromDatarows,
  resolveEndTimeFromDatarows,
  resolveDurationFromDatarows,
  resolveInstrumentationScopeFromDatarows,
  convertTimestampToNanos,
  extractStatusCode,
} from './ppl_resolve_helpers';

export interface TraceHit {
  traceId: string;
  droppedLinksCount: number;
  kind: string;
  droppedEventsCount: number;
  traceGroupFields: {
    endTime: string;
    durationInNanos: number;
    statusCode: number;
  };
  traceGroup: string;
  serviceName: string;
  parentSpanId: string;
  spanId: string;
  traceState: string;
  name: string;
  startTime: string;
  endTime: string;
  durationInNanos: number;
  'status.code': number;
  startTimeUnixNano?: string;
  endTimeUnixNano?: string;
  durationNano?: number;
  scope?: any;
  instrumentationScope?: any;
  [key: string]: any;
  sort: number[];
}

export interface PPLResponse {
  type?: string;
  body?: {
    name: string;
    schema?: Array<{
      name: string;
      type: string;
      values: any[];
    }>;
    fields: Array<{
      name: string;
      type: string;
      values: any[];
    }>;
    size: number;
    meta?: any;
  };
  // Direct structure (fallback)
  name?: string;
  schema?: Array<{
    name: string;
    type: string;
    values: any[];
  }>;
  fields?: Array<{
    name: string;
    type: string;
    values: any[];
  }>;
  size?: number;
  // Support for datarows format
  datarows?: any[][];
  total?: number;
}

export function transformPPLDataToTraceHits(pplResponse: PPLResponse): TraceHit[] {
  if (!pplResponse) {
    // eslint-disable-next-line no-console
    console.warn('PPL response is null or undefined');
    return [];
  }

  if (pplResponse.datarows && pplResponse.schema) {
    return transformDatarowsFormat(pplResponse);
  }

  let responseData;
  if (pplResponse.type === 'data_frame' && pplResponse.body) {
    responseData = pplResponse.body;
  } else {
    responseData = pplResponse;
  }

  if (!responseData.fields || !responseData.size || responseData.size === 0) {
    // eslint-disable-next-line no-console
    console.warn('PPL response has no data:', {
      hasFields: !!responseData.fields,
      size: responseData.size,
    });
    return [];
  }

  return transformFieldsFormat(responseData);
}

function transformDatarowsFormat(pplResponse: PPLResponse): TraceHit[] {
  const { schema, datarows } = pplResponse;

  if (!schema || !datarows || !datarows.length) {
    // eslint-disable-next-line no-console
    console.warn('Invalid datarows format response');
    return [];
  }

  const traceHits: TraceHit[] = [];

  const fieldIndexMap = new Map<string, number>();
  schema.forEach((field, index) => {
    fieldIndexMap.set(field.name, index);
  });

  for (let i = 0; i < datarows.length; i++) {
    const row = datarows[i];

    try {
      const getValueByName = (name: string) => {
        const index = fieldIndexMap.get(name);
        return index !== undefined ? row[index] : undefined;
      };

      const resolvedServiceName = resolveServiceNameFromDatarows(getValueByName);
      const resolvedStartTime = resolveStartTimeFromDatarows(getValueByName);
      const resolvedEndTime = resolveEndTimeFromDatarows(getValueByName);
      const resolvedDuration = resolveDurationFromDatarows(
        getValueByName,
        resolvedStartTime,
        resolvedEndTime
      );
      const resolvedInstrumentationScope = resolveInstrumentationScopeFromDatarows(getValueByName);

      const traceGroupFields = getValueByName('traceGroupFields') || {};
      const attributes = getValueByName('attributes') || {};
      const resource = getValueByName('resource') || {};

      const traceHit: TraceHit = {
        traceId: getValueByName('traceId') || '',
        droppedLinksCount: getValueByName('droppedLinksCount') || 0,
        kind: getValueByName('kind') || '',
        droppedEventsCount: getValueByName('droppedEventsCount') || 0,
        flags: getValueByName('flags') || 0,
        links: getValueByName('links') || [],
        events: getValueByName('events') || [],
        droppedAttributesCount: getValueByName('droppedAttributesCount') || 0,
        schemaUrl: getValueByName('schemaUrl') || '',

        instrumentationScope: resolvedInstrumentationScope,
        resource,

        traceGroupFields: {
          endTime: traceGroupFields.endTime || resolvedEndTime,
          durationInNanos: traceGroupFields.durationInNanos || resolvedDuration,
          statusCode: traceGroupFields.statusCode || 0,
        },
        traceGroup: getValueByName('traceGroup') || '',
        serviceName: resolvedServiceName,
        parentSpanId: getValueByName('parentSpanId') || '',
        spanId: getValueByName('spanId') || '',
        traceState: getValueByName('traceState') || '',
        name: getValueByName('name') || '',

        startTime: resolvedStartTime,
        endTime: resolvedEndTime,
        durationInNanos: resolvedDuration,

        startTimeUnixNano: getValueByName('startTimeUnixNano'),
        endTimeUnixNano: getValueByName('endTimeUnixNano'),
        durationNano: getValueByName('durationNano'),
        scope: getValueByName('scope'),

        status: getValueByName('status') || { code: 0, message: '' },
        'status.code': extractStatusCode(getValueByName('status')) || 0,
        attributes,
        sort: [convertTimestampToNanos(resolvedStartTime)],
      };

      traceHits.push(traceHit);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error processing span at index ${i}:`, error);
    }
  }

  return traceHits;
}

function transformFieldsFormat(responseData: any): TraceHit[] {
  const { fields, size } = responseData;
  const traceHits: TraceHit[] = [];

  const fieldMap = new Map<string, any[]>();
  fields.forEach((field: { name: string; values: any[] }) => {
    fieldMap.set(field.name, field.values);
  });

  for (let i = 0; i < size; i++) {
    try {
      const resolvedServiceName = resolveServiceName(fieldMap, i);
      const resolvedStartTime = resolveStartTime(fieldMap, i);
      const resolvedEndTime = resolveEndTime(fieldMap, i);
      const resolvedDuration = resolveDuration(fieldMap, i, resolvedStartTime, resolvedEndTime);
      const resolvedInstrumentationScope = resolveInstrumentationScope(fieldMap, i);

      const traceGroupFields = fieldMap.get('traceGroupFields')?.[i] || {};
      const attributes = fieldMap.get('attributes')?.[i] || {};
      const resource = fieldMap.get('resource')?.[i] || {};

      const traceHit: TraceHit = {
        traceId: fieldMap.get('traceId')?.[i] || '',
        droppedLinksCount: fieldMap.get('droppedLinksCount')?.[i] || 0,
        kind: fieldMap.get('kind')?.[i] || '',
        droppedEventsCount: fieldMap.get('droppedEventsCount')?.[i] || 0,
        flags: fieldMap.get('flags')?.[i] || 0,
        links: fieldMap.get('links')?.[i] || [],
        events: fieldMap.get('events')?.[i] || [],
        droppedAttributesCount: fieldMap.get('droppedAttributesCount')?.[i] || 0,
        schemaUrl: fieldMap.get('schemaUrl')?.[i] || '',

        instrumentationScope: resolvedInstrumentationScope,
        resource,

        traceGroupFields: {
          endTime: traceGroupFields.endTime || resolvedEndTime,
          durationInNanos: traceGroupFields.durationInNanos || resolvedDuration,
          statusCode:
            traceGroupFields.statusCode || extractStatusCode(fieldMap.get('status')?.[i]) || 0,
        },
        traceGroup: fieldMap.get('traceGroup')?.[i] || '',
        serviceName: resolvedServiceName,
        parentSpanId: fieldMap.get('parentSpanId')?.[i] || '',
        spanId: fieldMap.get('spanId')?.[i] || '',
        traceState: fieldMap.get('traceState')?.[i] || '',
        name: fieldMap.get('name')?.[i] || '',

        startTime: resolvedStartTime,
        endTime: resolvedEndTime,
        durationInNanos: resolvedDuration,

        startTimeUnixNano: fieldMap.get('startTimeUnixNano')?.[i],
        endTimeUnixNano: fieldMap.get('endTimeUnixNano')?.[i],
        durationNano: fieldMap.get('durationNano')?.[i],
        scope: fieldMap.get('scope')?.[i],

        status: fieldMap.get('status')?.[i] || { code: 0, message: '' },
        'status.code': extractStatusCode(fieldMap.get('status')?.[i]) || 0,
        attributes,
        sort: [convertTimestampToNanos(resolvedStartTime)],
      };

      traceHits.push(traceHit);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error processing span at index ${i}:`, error);
    }
  }

  return traceHits;
}
