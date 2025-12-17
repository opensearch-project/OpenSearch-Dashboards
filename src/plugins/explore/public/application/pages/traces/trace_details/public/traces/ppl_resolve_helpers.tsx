/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function convertTimestampToNanos(timestamp: string | number): number {
  if (!timestamp) return 0;

  try {
    let time: number;

    if (typeof timestamp === 'string') {
      // Check if it's a pure numeric string (nanosecond timestamp)
      const numericMatch = timestamp.match(/^\d+$/);
      if (numericMatch) {
        time = parseInt(timestamp, 10);
      } else {
        let dateString = timestamp;

        // Convert "YYYY-MM-DD HH:mm:ss.SSS" format to ISO format for better parsing
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(timestamp)) {
          dateString = timestamp.replace(' ', 'T') + 'Z';
        }

        time = new Date(dateString).getTime();
        // Check if the date is invalid (NaN)
        if (isNaN(time)) {
          // Try parsing as a direct timestamp if ISO parsing fails
          const directParse = Date.parse(timestamp);
          if (!isNaN(directParse)) {
            time = directParse;
          } else {
            return 0;
          }
        }
      }
    } else {
      time = timestamp;
    }

    // If time is already in nanoseconds (very large number), return as is
    if (time > 1e15) {
      return time;
    }

    return time * 1000000; // Convert milliseconds to nanoseconds
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error converting timestamp to nanos:', timestamp, error);
    return 0;
  }
}

export function hasNanosecondPrecision(timestamp: string | number): boolean {
  if (!timestamp) return false;

  if (typeof timestamp === 'number') {
    // If it's a large number (> 1e15)
    return timestamp > 1e15;
  }

  if (typeof timestamp === 'string') {
    // If it's a pure number string with more than 13 digits
    const numericMatch = timestamp.match(/^\d+$/);
    if (numericMatch && timestamp.length > 13) {
      return true;
    }

    // Check for ISO strings with high precision (more than 3 decimal places in seconds)
    const isoMatch = timestamp.match(/\.\d{4,}/);
    if (isoMatch) {
      return true;
    }

    // Check for Unix nano timestamp patterns (19 digits)
    if (/^\d{19}$/.test(timestamp)) {
      return true;
    }
  }

  return false;
}

export function extractStatusCode(status: any): number {
  if (!status) return 0;

  if (typeof status === 'number') {
    return status;
  }

  if (typeof status === 'object') {
    if (typeof status.code === 'string') {
      switch (status.code.toLowerCase()) {
        case 'unset':
          return 0;
        case 'ok':
          return 1;
        case 'error':
          return 2;
        default:
          return 0;
      }
    }

    if (typeof status.code === 'number') {
      return status.code;
    }
    if (status.status_code !== undefined) {
      return status.status_code;
    }
  }

  return 0;
}

export function resolveServiceName(fieldMap: Map<string, any[]>, index: number): string {
  const process = fieldMap.get('process')?.[index];
  if (process?.serviceName) {
    return process.serviceName;
  }

  const resource = fieldMap.get('resource')?.[index];
  if (resource?.attributes?.service?.name) {
    return resource.attributes.service.name;
  }

  return fieldMap.get('serviceName')?.[index] || '';
}

export function resolveStartTime(fieldMap: Map<string, any[]>, index: number): string {
  const startTimeUnixNano = fieldMap.get('startTimeUnixNano')?.[index];
  if (startTimeUnixNano) {
    return startTimeUnixNano.toString();
  }

  // Jaeger: startTime is microseconds, startTimeMillis is formatted date
  const jaegerStartTime = fieldMap.get('startTime')?.[index];
  if (jaegerStartTime && typeof jaegerStartTime === 'number') {
    // Convert to nanoseconds
    return (jaegerStartTime * 1000).toString();
  }

  const startTimeMillis = fieldMap.get('startTimeMillis')?.[index];
  if (startTimeMillis) {
    return startTimeMillis.toString();
  }

  return fieldMap.get('startTime')?.[index]?.toString() || '';
}

export function resolveEndTime(fieldMap: Map<string, any[]>, index: number): string {
  const endTimeUnixNano = fieldMap.get('endTimeUnixNano')?.[index];
  if (endTimeUnixNano) {
    return endTimeUnixNano.toString();
  }

  // Calculate from Jaeger startTime + duration
  const jaegerStartTime = fieldMap.get('startTime')?.[index];
  const jaegerDuration = fieldMap.get('duration')?.[index];
  if (
    jaegerStartTime &&
    jaegerDuration &&
    typeof jaegerStartTime === 'number' &&
    typeof jaegerDuration === 'number'
  ) {
    // Both in microseconds, convert to nanoseconds
    const endTimeMicros = jaegerStartTime + jaegerDuration;
    return (endTimeMicros * 1000).toString();
  }

  return fieldMap.get('endTime')?.[index]?.toString() || '';
}

export function resolveTimestamp(fieldMap: Map<string, any[]>, index: number): string {
  return fieldMap.get('endTimeUnixNano')?.[index] || fieldMap.get('@timestamp')?.[index] || '';
}

export function resolveTime(fieldMap: Map<string, any[]>, index: number): string {
  return fieldMap.get('endTimeUnixNano')?.[index] || fieldMap.get('time')?.[index] || '';
}

export function resolveDuration(
  fieldMap: Map<string, any[]>,
  index: number,
  startTime: string,
  endTime: string
): number {
  const durationNano = fieldMap.get('durationNano')?.[index];
  const durationInNanos = fieldMap.get('durationInNanos')?.[index];
  const jaegerDuration = fieldMap.get('duration')?.[index];

  // Convert Jaeger microsecond duration to nanoseconds
  if (
    jaegerDuration !== null &&
    jaegerDuration !== undefined &&
    typeof jaegerDuration === 'number'
  ) {
    return jaegerDuration * 1000;
  }

  if (startTime && endTime) {
    const hasStartNanoPrecision = hasNanosecondPrecision(startTime);
    const hasEndNanoPrecision = hasNanosecondPrecision(endTime);

    if (hasStartNanoPrecision && hasEndNanoPrecision) {
      try {
        const startNanos = convertTimestampToNanos(startTime);
        const endNanos = convertTimestampToNanos(endTime);
        if (startNanos > 0 && endNanos > 0 && endNanos > startNanos) {
          return endNanos - startNanos;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error calculating duration from high-precision timestamps:', error);
      }
    }

    // If timestamps lack precision, prefer provided duration fields for better accuracy
    if ((!hasStartNanoPrecision || !hasEndNanoPrecision) && (durationNano || durationInNanos)) {
      return durationNano || durationInNanos;
    }

    // Fall back to calculated duration from lower-precision timestamps
    try {
      const startNanos = convertTimestampToNanos(startTime);
      const endNanos = convertTimestampToNanos(endTime);
      if (startNanos > 0 && endNanos > 0 && endNanos > startNanos) {
        return endNanos - startNanos;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error calculating duration from low-precision timestamps:', error);
    }
  }

  // Final fallback to provided duration fields
  return durationNano || durationInNanos || 0;
}

export function resolveInstrumentationScope(fieldMap: Map<string, any[]>, index: number): any {
  return fieldMap.get('scope')?.[index] || fieldMap.get('instrumentationScope')?.[index] || {};
}

export function resolveServiceNameFromDatarows(getValueByName: (name: string) => any): string {
  // Jaeger
  const process = getValueByName('process');
  if (process?.serviceName) {
    return process.serviceName;
  }

  const resource = getValueByName('resource');
  if (resource?.attributes?.service?.name) {
    return resource.attributes.service.name;
  }

  return getValueByName('serviceName') || '';
}

export function resolveStartTimeFromDatarows(getValueByName: (name: string) => any): string {
  const startTimeUnixNano = getValueByName('startTimeUnixNano');
  if (startTimeUnixNano) {
    return startTimeUnixNano.toString();
  }

  const jaegerStartTime = getValueByName('startTime');
  if (jaegerStartTime && typeof jaegerStartTime === 'number') {
    // Convert microseconds to nanoseconds
    return (jaegerStartTime * 1000).toString();
  }

  const startTimeMillis = getValueByName('startTimeMillis');
  if (startTimeMillis) {
    return startTimeMillis.toString();
  }

  return getValueByName('startTime')?.toString() || '';
}

export function resolveEndTimeFromDatarows(getValueByName: (name: string) => any): string {
  const endTimeUnixNano = getValueByName('endTimeUnixNano');
  if (endTimeUnixNano) {
    return endTimeUnixNano.toString();
  }

  const jaegerStartTime = getValueByName('startTime');
  const jaegerDuration = getValueByName('duration');
  if (
    jaegerStartTime &&
    jaegerDuration &&
    typeof jaegerStartTime === 'number' &&
    typeof jaegerDuration === 'number'
  ) {
    // Both in microseconds, convert to nanoseconds
    const endTimeMicros = jaegerStartTime + jaegerDuration;
    return (endTimeMicros * 1000).toString();
  }

  return getValueByName('endTime')?.toString() || '';
}

export function resolveDurationFromDatarows(
  getValueByName: (name: string) => any,
  startTime: string,
  endTime: string
): number {
  const durationNano = getValueByName('durationNano');
  const durationInNanos = getValueByName('durationInNanos');
  const jaegerDuration = getValueByName('duration');

  // Convert Jaeger microsecond duration to nanoseconds
  if (
    jaegerDuration !== null &&
    jaegerDuration !== undefined &&
    typeof jaegerDuration === 'number'
  ) {
    return jaegerDuration * 1000;
  }

  if (startTime && endTime) {
    const hasStartNanoPrecision = hasNanosecondPrecision(startTime);
    const hasEndNanoPrecision = hasNanosecondPrecision(endTime);

    if (hasStartNanoPrecision && hasEndNanoPrecision) {
      try {
        const startNanos = convertTimestampToNanos(startTime);
        const endNanos = convertTimestampToNanos(endTime);
        if (startNanos > 0 && endNanos > 0 && endNanos > startNanos) {
          return endNanos - startNanos;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error calculating duration from high-precision timestamps:', error);
      }
    }

    // If timestamps lack precision, prefer provided duration fields for better accuracy
    if ((!hasStartNanoPrecision || !hasEndNanoPrecision) && (durationNano || durationInNanos)) {
      return durationNano || durationInNanos;
    }

    // Fall back to calculated duration from lower-precision timestamps
    try {
      const startNanos = convertTimestampToNanos(startTime);
      const endNanos = convertTimestampToNanos(endTime);
      if (startNanos > 0 && endNanos > 0 && endNanos > startNanos) {
        return endNanos - startNanos;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error calculating duration from low-precision timestamps:', error);
    }
  }

  // Final fallback to provided duration fields
  return durationNano || durationInNanos || 0;
}

export function resolveInstrumentationScopeFromDatarows(
  getValueByName: (name: string) => any
): any {
  return getValueByName('scope') || getValueByName('instrumentationScope') || {};
}

export function isSpanError(span: any): boolean {
  if (!span) return false;

  // DataPrepper error detection
  if (span['status.code'] === 2) {
    return true;
  }

  if (span.status) {
    const statusCode = extractStatusCode(span.status);
    if (statusCode === 2) {
      return true;
    }
  }

  // Jaeger error detection - check tag.error field
  if (span.tag?.error === 'true' || span.tag?.error === true) {
    return true;
  }

  // Jaeger error detection - check tags array for error indicators
  if (span.tags && Array.isArray(span.tags)) {
    // Check for error tag
    const errorTag = span.tags.find((tag: any) => tag?.key === 'error');
    if (errorTag?.value === 'true' || errorTag?.value === true) {
      return true;
    }

    // Check for gRPC status codes (anything > 0 is an error)
    const grpcStatusTag = span.tags.find((tag: any) => tag?.key === 'rpc.grpc.status_code');
    if (grpcStatusTag?.value && parseInt(grpcStatusTag.value, 10) > 0) {
      return true;
    }

    // Check for OpenTelemetry status description (indicates error)
    const statusDescTag = span.tags.find((tag: any) => tag?.key === 'otel.status_description');
    if (statusDescTag?.value && statusDescTag.value.trim()) {
      return true;
    }
  }

  // Check for exception events
  if (span.events && Array.isArray(span.events)) {
    const hasException = span.events.some(
      (event: any) =>
        event?.name === 'exception' ||
        event?.attributes?.exception ||
        (event?.fields &&
          Array.isArray(event.fields) &&
          event.fields.some((field: any) => field?.key === 'event' && field?.value === 'exception'))
    );
    if (hasException) {
      return true;
    }
  }

  // Check Jaeger logs for exception events
  if (span.logs && Array.isArray(span.logs)) {
    const hasException = span.logs.some(
      (log: any) =>
        log?.fields &&
        Array.isArray(log.fields) &&
        log.fields.some((field: any) => field?.key === 'event' && field?.value === 'exception')
    );
    if (hasException) {
      return true;
    }
  }

  const httpStatusCode = extractHttpStatusCode(span);
  if (httpStatusCode && httpStatusCode >= 400) {
    return true;
  }

  return false;
}

function extractHttpStatusCode(span: any): number | undefined {
  if (!span) return undefined;

  const source = span._source || span;

  // Check Jaeger tags
  if (span.tags && Array.isArray(span.tags)) {
    const httpStatusTag = span.tags.find((tag: any) => tag?.key === 'http.status_code');
    if (httpStatusTag?.value) {
      const statusCode = parseInt(httpStatusTag.value, 10);
      if (!isNaN(statusCode)) {
        return statusCode;
      }
    }
  }

  // Check process tags
  if (span.process?.tags && Array.isArray(span.process.tags)) {
    const httpStatusTag = span.process.tags.find((tag: any) => tag?.key === 'http.status_code');
    if (httpStatusTag?.value) {
      const statusCode = parseInt(httpStatusTag.value, 10);
      if (!isNaN(statusCode)) {
        return statusCode;
      }
    }
  }

  return (
    source['attributes.http.status_code'] ||
    source.attributes?.['http.status_code'] ||
    source.attributes?.http?.status_code ||
    source.attributes?.http?.response?.status_code ||
    source.attributes?.['http.response.status_code'] ||
    source['http.status_code'] ||
    source.http?.status_code ||
    source.statusCode ||
    undefined
  );
}

export function resolveServiceNameFromSpan(span: any): string {
  if (!span) return '';

  // Jaeger
  if (span.process?.serviceName) {
    return span.process.serviceName;
  }

  // DataPrepper
  if (span.resource?.attributes?.service?.name) {
    return span.resource.attributes.service.name;
  }

  if (span.resource?.attributes?.['service.name']) {
    return span.resource.attributes['service.name'];
  }

  return span.serviceName || span.name || '';
}
