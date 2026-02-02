/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable */

import { OsdError } from '../../../../opensearch_dashboards_utils/common/';

/**
 * Tried to call a method that relies on SearchSource having an dataView assigned
 */
export class DataViewMissingIndices extends OsdError {
  constructor(message: string) {
    const defaultMessage = "DataView's configured pattern does not match any indices";

    super(
      message && message.length ? `No matching indices found: ${message}` : defaultMessage
    );
  }
}
