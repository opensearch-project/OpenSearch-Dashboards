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
        // Handle ISO string format
        time = new Date(timestamp).getTime();
        // Check if the date is invalid (NaN)
        if (isNaN(time)) {
          return 0;
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
  const resource = fieldMap.get('resource')?.[index];
  if (resource?.attributes?.service?.name) {
    return resource.attributes.service.name;
  }

  return fieldMap.get('serviceName')?.[index] || '';
}

export function resolveStartTime(fieldMap: Map<string, any[]>, index: number): string {
  return fieldMap.get('startTimeUnixNano')?.[index] || fieldMap.get('startTime')?.[index] || '';
}

export function resolveEndTime(fieldMap: Map<string, any[]>, index: number): string {
  return fieldMap.get('endTimeUnixNano')?.[index] || fieldMap.get('endTime')?.[index] || '';
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
  const resource = getValueByName('resource');
  if (resource?.attributes?.service?.name) {
    return resource.attributes.service.name;
  }

  return getValueByName('serviceName') || '';
}

export function resolveStartTimeFromDatarows(getValueByName: (name: string) => any): string {
  return getValueByName('startTimeUnixNano') || getValueByName('startTime') || '';
}

export function resolveEndTimeFromDatarows(getValueByName: (name: string) => any): string {
  return getValueByName('endTimeUnixNano') || getValueByName('endTime') || '';
}

export function resolveDurationFromDatarows(
  getValueByName: (name: string) => any,
  startTime: string,
  endTime: string
): number {
  const durationNano = getValueByName('durationNano');
  const durationInNanos = getValueByName('durationInNanos');

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

  if (span['status.code'] === 2) {
    return true;
  }

  if (span.status) {
    const statusCode = extractStatusCode(span.status);
    if (statusCode === 2) {
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

  if (span.resource?.attributes?.service?.name) {
    return span.resource.attributes.service.name;
  }

  if (span.resource?.attributes?.['service.name']) {
    return span.resource.attributes['service.name'];
  }

  return span.serviceName || span.name || '';
}
