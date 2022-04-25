/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { createGeospatialCluster } from './clusters';
import { GeospatialService, OpensearchService } from './services';
import { geospatial, opensearch } from '../server/routes';
import { getUiSettings } from './ui_settings';

export class RegionMapPlugin {
  constructor(initializerContext) {
    this.logger = initializerContext.logger.get();
    this.globalConfig$ = initializerContext.config.legacy.globalConfig$;
  }

  async setup(core) {
    const globalConfig = await this.globalConfig$.pipe(first()).toPromise();

    const geospatialClient = createGeospatialCluster(core, globalConfig);

    // Initialize services
    const geospatialService = new GeospatialService(geospatialClient);
    const opensearchService = new OpensearchService(geospatialClient);

    // Register server side APIs
    const router = core.http.createRouter();
    core.uiSettings.register(getUiSettings());
    geospatial(geospatialService, router);
    opensearch(opensearchService, router);

    return {};
  }

  async start() {
    return {};
  }

  async stop() {}
}
