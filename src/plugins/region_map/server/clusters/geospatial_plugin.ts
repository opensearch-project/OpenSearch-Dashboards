/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UPLOAD_GEOJSON_API } from '../../common/constants/shared';

// eslint-disable-next-line import/no-default-export
export default function GeospatialPlugin(Client, config, components) {
  const ca = components.clientAction.factory;
  Client.prototype.geospatial = components.clientAction.namespaceFactory();
  const geospatial = Client.prototype.geospatial.prototype;

  geospatial.geospatialQuery = ca({
    url: {
      fmt: `${UPLOAD_GEOJSON_API}`,
    },
    method: 'POST',
  });
}
