/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { OsdError } from '../../../../opensearch_dashboards_utils/common';

/**
 * Error thrown when attempting to use an AnalyticEngine data source
 * with a visualization that doesn't support it.
 * This error should be displayed in the visualization area, not as a toast.
 */
export class AnalyticEngineError extends OsdError {
  constructor() {
    const message = i18n.translate('data.search.analyticEngineError', {
      defaultMessage:
        'This data source uses Analytic Engine which does not support DSL queries. Use PPL-compatible features or switch to a standard OpenSearch data source.',
    });

    super(message);
    this.name = 'AnalyticEngineError';
  }
}
