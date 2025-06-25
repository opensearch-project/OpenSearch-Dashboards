/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OsdError } from '../../../../opensearch_dashboards_utils/common/';

/**
 * Tried to call a method that relies on SearchSource having an dataset assigned
 */
export class DatasetMissingData extends OsdError {
  constructor(message: string) {
    const defaultMessage = "Dataset's configured pattern does not match any data";

    super(message && message.length ? `No matching data found: ${message}` : defaultMessage);
  }
}
