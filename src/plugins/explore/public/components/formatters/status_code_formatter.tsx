/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBadge } from '@elastic/eui';

interface StatusCodeFormatterProps {
  value: string | number;
  fieldName?: string;
}

/**
 * HTTP Status Codes:
 * - 2xx: Green (Success)
 * - 3xx: Blue (Redirect)
 * - 4xx: Orange (Client Error)
 * - 5xx: Red (Server Error)
 * - Other: Gray (Unknown)
 *
 * https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/api.md#set-status
 * Trace Status Codes:
 * - 0: Unset (Gray)
 * - 1: Ok (Green)
 * - 2: Error (Red)
 */
export const StatusCodeFormatter: React.FC<StatusCodeFormatterProps> = ({ value, fieldName }) => {
  const statusCode = String(value);

  let color = 'default';
  let label = statusCode;

  // Handle trace status codes (status.code)
  if (fieldName === 'status.code') {
    switch (statusCode) {
      case '0':
        color = 'default'; // Gray for Unset
        label = '0 - Unset';
        break;
      case '1':
        color = 'success'; // Green for Ok
        label = '1 - Ok';
        break;
      case '2':
        color = 'danger'; // Red for Error
        label = '2 - Error';
        break;
      default:
        color = 'default'; // Gray for unknown values
        break;
    }
  }
  // Handle HTTP status codes (attributes.http.status_code)
  if (fieldName === 'attributes.http.status_code') {
    if (statusCode.startsWith('2')) {
      color = 'success'; // Green for 2xx
    } else if (statusCode.startsWith('3')) {
      color = 'primary'; // Blue for 3xx
    } else if (statusCode.startsWith('4')) {
      color = 'warning'; // Orange for 4xx
    } else if (statusCode.startsWith('5')) {
      color = 'danger'; // Red for 5xx
    } else {
      color = 'default'; // Gray for unknown values
    }
  }

  return <EuiBadge color={color}>{label}</EuiBadge>;
};
