/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpensearchService } from './services';
import { opensearch } from '../server/routes';
import { getUiSettings } from './ui_settings';

export class RegionMapPlugin {
  constructor(initializerContext) {
    this.logger = initializerContext.logger.get();
  }

  async setup(core) {
    const opensearchClient = core.opensearch.legacy.createClient('opensearch');

    // Initialize services
    const opensearchService = new OpensearchService(opensearchClient);

    // Register server side APIs
    const router = core.http.createRouter();
    core.uiSettings.register(getUiSettings());
    opensearch(opensearchService, router);

    return {};
  }

  async start() {
    return {};
  }

  async stop() {}
}
