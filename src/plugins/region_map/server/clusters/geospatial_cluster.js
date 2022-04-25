/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import GeospatialPlugin from './geospatial_plugin';
import { CLUSTER, DEFAULT_HEADERS } from '../services/utils/constants';

export default function createGeospatialCluster(core, globalConfig) {
  const { customHeaders, ...rest } = globalConfig.opensearch;
  return core.opensearch.legacy.createClient(CLUSTER.GEOSPATIAL, {
    plugins: [GeospatialPlugin],
    // Currently we are overriding any headers with our own since we explicitly required User-Agent to be OpenSearch Dashboards
    // for integration with our backend plugin.
    customHeaders: { ...customHeaders, ...DEFAULT_HEADERS },
    ...rest,
  });
}
