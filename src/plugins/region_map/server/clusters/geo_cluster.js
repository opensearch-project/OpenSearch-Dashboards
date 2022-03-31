/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import GeoPlugin from './geo_plugin';
import { CLUSTER, DEFAULT_HEADERS } from '../services/utils/constants';

export default function createGeoCluster(core, globalConfig) {
  const { customHeaders, ...rest } = globalConfig.opensearch;
  return core.opensearch.legacy.createClient(CLUSTER.GEOSPATIAL, {
    plugins: [GeoPlugin],
    // Currently we are overriding any headers with our own since we explicitly required User-Agent to be OpenSearch Dashboards
    // for integration with our backend plugin.
    customHeaders: { ...customHeaders, ...DEFAULT_HEADERS },
    ...rest,
  });
}
